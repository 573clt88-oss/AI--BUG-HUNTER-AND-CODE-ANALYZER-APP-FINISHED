# Subscription and Usage Management Service
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorCollection
import logging
from .models import (
    User, SubscriptionTier, SubscriptionStatus, SUBSCRIPTION_PLANS,
    PaymentTransaction, PaymentStatus, UsageRecord
)

logger = logging.getLogger(__name__)

class SubscriptionService:
    def __init__(self, db):
        self.db = db
        self.users: AsyncIOMotorCollection = db.users
        self.payments: AsyncIOMotorCollection = db.payment_transactions
        self.usage: AsyncIOMotorCollection = db.usage_records

    async def create_user(self, firebase_uid: str, email: str, display_name: str = None) -> User:
        """Create new user with free trial"""
        # Check if user already exists
        existing_user = await self.users.find_one({"firebase_uid": firebase_uid})
        if existing_user:
            return User(**existing_user)
        
        # Create new user with 7-day free trial
        trial_end = datetime.utcnow() + timedelta(days=7)
        
        user = User(
            firebase_uid=firebase_uid,
            email=email,
            display_name=display_name,
            subscription_tier=SubscriptionTier.FREE,
            subscription_status=SubscriptionStatus.TRIALING,
            trial_ends_at=trial_end,
            monthly_limit=10,
            monthly_analyses_used=0
        )
        
        await self.users.insert_one(user.dict())
        
        # Send welcome email (will implement with SendGrid)
        await self._send_welcome_email(user)
        
        logger.info(f"Created new user: {email} with trial ending {trial_end}")
        return user

    async def get_user(self, firebase_uid: str) -> Optional[User]:
        """Get user by Firebase UID"""
        user_data = await self.users.find_one({"firebase_uid": firebase_uid})
        return User(**user_data) if user_data else None

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by internal ID"""
        user_data = await self.users.find_one({"id": user_id})
        return User(**user_data) if user_data else None

    async def check_usage_limit(self, user: User) -> Dict[str, any]:
        """Check if user can perform analysis"""
        # Reset monthly usage if needed
        now = datetime.utcnow()
        if user.last_reset_date.month != now.month or user.last_reset_date.year != now.year:
            user.monthly_analyses_used = 0
            user.last_reset_date = now
            await self.users.update_one(
                {"id": user.id},
                {"$set": {
                    "monthly_analyses_used": 0,
                    "last_reset_date": now
                }}
            )

        # Check trial status
        if user.subscription_status == SubscriptionStatus.TRIALING:
            if user.trial_ends_at and now > user.trial_ends_at:
                # Trial expired - downgrade to free
                await self._downgrade_to_free(user)
                user.subscription_status = SubscriptionStatus.ACTIVE
                user.subscription_tier = SubscriptionTier.FREE

        # Check limits based on tier
        plan = SUBSCRIPTION_PLANS[user.subscription_tier]
        
        if plan.monthly_limit == -1:  # Unlimited (Pro)
            return {
                "can_analyze": True,
                "remaining": -1,
                "limit": -1,
                "tier": user.subscription_tier
            }
        
        remaining = plan.monthly_limit - user.monthly_analyses_used
        can_analyze = remaining > 0
        
        return {
            "can_analyze": can_analyze,
            "remaining": remaining,
            "limit": plan.monthly_limit,
            "tier": user.subscription_tier,
            "trial_ends": user.trial_ends_at,
            "is_trialing": user.subscription_status == SubscriptionStatus.TRIALING
        }

    async def record_analysis(self, user: User) -> bool:
        """Record an analysis usage"""
        usage_check = await self.check_usage_limit(user)
        
        if not usage_check["can_analyze"]:
            return False
        
        # Increment usage count
        await self.users.update_one(
            {"id": user.id},
            {"$inc": {"monthly_analyses_used": 1}}
        )
        
        # Record usage
        usage_record = UsageRecord(
            user_id=user.id,
            action="code_analysis",
            metadata={"tier": user.subscription_tier}
        )
        await self.usage.insert_one(usage_record.dict())
        
        return True

    async def upgrade_to_pro(self, user: User, stripe_customer_id: str, stripe_subscription_id: str) -> bool:
        """Upgrade user to Pro tier"""
        try:
            updates = {
                "subscription_tier": SubscriptionTier.PRO,
                "subscription_status": SubscriptionStatus.ACTIVE,
                "monthly_limit": -1,
                "stripe_customer_id": stripe_customer_id,
                "stripe_subscription_id": stripe_subscription_id,
                "subscription_ends_at": None,  # Will be managed by Stripe
                "trial_ends_at": None
            }
            
            await self.users.update_one(
                {"id": user.id},
                {"$set": updates}
            )
            
            # Send upgrade confirmation email
            await self._send_upgrade_email(user)
            
            logger.info(f"Upgraded user {user.email} to Pro tier")
            return True
            
        except Exception as e:
            logger.error(f"Failed to upgrade user {user.email}: {str(e)}")
            return False

    async def _downgrade_to_free(self, user: User) -> bool:
        """Downgrade user to free tier"""
        try:
            updates = {
                "subscription_tier": SubscriptionTier.FREE,
                "subscription_status": SubscriptionStatus.ACTIVE,
                "monthly_limit": 10,
                "trial_ends_at": None
            }
            
            await self.users.update_one(
                {"id": user.id},
                {"$set": updates}
            )
            
            # Send trial expired email
            await self._send_trial_expired_email(user)
            
            logger.info(f"Downgraded user {user.email} to Free tier")
            return True
            
        except Exception as e:
            logger.error(f"Failed to downgrade user {user.email}: {str(e)}")
            return False

    async def cancel_subscription(self, user: User) -> bool:
        """Cancel user subscription (will downgrade at period end)"""
        try:
            await self.users.update_one(
                {"id": user.id},
                {"$set": {
                    "subscription_status": SubscriptionStatus.CANCELLED,
                    # Keep Pro features until period end
                }}
            )
            
            # Send cancellation confirmation email
            await self._send_cancellation_email(user)
            
            logger.info(f"Cancelled subscription for user {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cancel subscription for user {user.email}: {str(e)}")
            return False

    async def get_subscription_stats(self) -> Dict[str, any]:
        """Get subscription statistics for admin"""
        total_users = await self.users.count_documents({})
        
        active_subs = await self.users.count_documents({
            "subscription_status": SubscriptionStatus.ACTIVE,
            "subscription_tier": SubscriptionTier.PRO
        })
        
        trialing_users = await self.users.count_documents({
            "subscription_status": SubscriptionStatus.TRIALING
        })
        
        # Calculate monthly revenue (simplified)
        pro_plan = SUBSCRIPTION_PLANS[SubscriptionTier.PRO]
        monthly_revenue = active_subs * pro_plan.monthly_price
        
        return {
            "total_users": total_users,
            "active_subscriptions": active_subs,
            "trialing_users": trialing_users,
            "monthly_revenue": monthly_revenue,
            "conversion_rate": (active_subs / total_users * 100) if total_users > 0 else 0
        }

    # Email notification methods (placeholders - will implement with SendGrid)
    async def _send_welcome_email(self, user: User):
        """Send welcome email with trial info"""
        # Will implement with SendGrid integration
        logger.info(f"Would send welcome email to {user.email}")

    async def _send_upgrade_email(self, user: User):
        """Send Pro upgrade confirmation email"""
        logger.info(f"Would send upgrade email to {user.email}")

    async def _send_trial_expired_email(self, user: User):
        """Send trial expired email"""
        logger.info(f"Would send trial expired email to {user.email}")

    async def _send_cancellation_email(self, user: User):
        """Send subscription cancellation email"""
        logger.info(f"Would send cancellation email to {user.email}")

    async def _send_usage_warning_email(self, user: User):
        """Send usage limit warning email"""
        logger.info(f"Would send usage warning email to {user.email}")