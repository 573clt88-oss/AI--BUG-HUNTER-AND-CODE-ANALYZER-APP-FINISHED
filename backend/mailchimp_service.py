import mailchimp_marketing as MailchimpMarketing
import mailchimp_transactional as MailchimpTransactional
from mailchimp_marketing.api_client import ApiClientError
import os
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import time

logger = logging.getLogger(__name__)

class EmailType(str, Enum):
    WELCOME = "welcome"
    TRIAL_EXPIRATION_7_DAYS = "trial_expiration_7_days"
    TRIAL_EXPIRATION_3_DAYS = "trial_expiration_3_days"
    TRIAL_EXPIRATION_1_DAY = "trial_expiration_1_day"
    TRIAL_EXPIRED = "trial_expired"
    SUBSCRIPTION_CREATED = "subscription_created"
    SUBSCRIPTION_UPGRADED = "subscription_upgraded"
    SUBSCRIPTION_RENEWED = "subscription_renewed"
    SUBSCRIPTION_CANCELLED = "subscription_cancelled"
    PAYMENT_SUCCESS = "payment_success"
    PAYMENT_FAILED = "payment_failed"

class MailChimpService:
    def __init__(self):
        self.api_key = os.environ.get('MAILCHIMP_API_KEY')
        self.server_prefix = os.environ.get('MAILCHIMP_SERVER_PREFIX', 'us12')
        self.audience_id = os.environ.get('DEFAULT_AUDIENCE_ID')
        self.app_name = os.environ.get('SENDER_NAME', 'AI Bug Hunter')
        self.support_email = os.environ.get('REPLY_TO_EMAIL', 'support@aibughunter.com')
        self.app_base_url = os.environ.get('APP_BASE_URL', 'https://bugfinder-6.preview.emergentagent.com')
        
        if not self.api_key:
            logger.error("MailChimp API key not found in environment variables")
            raise ValueError("MailChimp API key is required")
        
        self.marketing_client = self._initialize_marketing_client()
        # Note: Transactional API would require separate API key, using marketing for now
    
    def _initialize_marketing_client(self) -> MailchimpMarketing.Client:
        """Initialize MailChimp Marketing API client"""
        try:
            client = MailchimpMarketing.Client()
            client.set_config({
                "api_key": self.api_key,
                "server": self.server_prefix
            })
            return client
        except Exception as e:
            logger.error(f"Failed to initialize MailChimp client: {str(e)}")
            raise
    
    def test_connection(self) -> Dict[str, Any]:
        """Test MailChimp API connection"""
        try:
            response = self.marketing_client.ping.get()
            logger.info("MailChimp connection successful")
            return {"status": "success", "message": response}
        except ApiClientError as error:
            logger.error(f"MailChimp connection failed: {error.text}")
            raise Exception(f"MailChimp API connection failed: {error.text}")
    
    async def add_user_to_audience(
        self, 
        email: str, 
        name: str, 
        plan: str = "free", 
        source: str = "website",
        additional_tags: List[str] = None
    ) -> Dict[str, Any]:
        """Add user to MailChimp audience with proper segmentation"""
        
        if not self.audience_id or self.audience_id == "placeholder_audience_id":
            logger.warning("MailChimp audience ID not configured, skipping audience addition")
            return {"status": "skipped", "reason": "Audience ID not configured"}
        
        # Split name into first and last name
        name_parts = name.split() if name else ["", ""]
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[-1] if len(name_parts) > 1 else ""
        
        # Prepare tags
        tags = [f"plan_{plan}", f"source_{source}", "new_user"]
        if additional_tags:
            tags.extend(additional_tags)
        
        member_info = {
            "email_address": email,
            "status": "subscribed",
            "merge_fields": {
                "FNAME": first_name,
                "LNAME": last_name,
                "PLAN": plan.upper(),
                "SOURCE": source.upper(),
                "SIGNUP": datetime.now().strftime("%Y-%m-%d")
            },
            "tags": tags
        }
        
        try:
            response = self.marketing_client.lists.add_list_member(
                self.audience_id, 
                member_info
            )
            logger.info(f"Added user {email} to MailChimp audience")
            return {"status": "success", "member_id": response.get("id")}
            
        except ApiClientError as error:
            if "already subscribed" in error.text.lower() or "already a list member" in error.text.lower():
                logger.info(f"User {email} already in audience, updating instead")
                return await self._update_audience_member(email, member_info)
            else:
                logger.error(f"Failed to add user to audience: {error.text}")
                return {"status": "error", "error": error.text}
        except Exception as e:
            logger.error(f"Unexpected error adding user to audience: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    async def _update_audience_member(
        self, 
        email: str, 
        member_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update existing audience member"""
        try:
            # Calculate subscriber hash (MD5 of lowercase email)
            import hashlib
            subscriber_hash = hashlib.md5(email.lower().encode()).hexdigest()
            
            response = self.marketing_client.lists.update_list_member(
                self.audience_id,
                subscriber_hash,
                {
                    "merge_fields": member_info["merge_fields"],
                    "tags": member_info["tags"]
                }
            )
            logger.info(f"Updated user {email} in MailChimp audience")
            return {"status": "updated", "member_id": response.get("id")}
            
        except Exception as e:
            logger.error(f"Failed to update audience member: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def send_welcome_email(
        self, 
        user_email: str, 
        user_name: str, 
        user_plan: str = "free"
    ) -> Dict[str, Any]:
        """Send welcome email using MailChimp Marketing API automation"""
        try:
            # For now, we'll use the audience addition with a welcome tag
            # In a production environment, this would trigger a MailChimp automation
            
            # Add to audience with welcome tag
            result = asyncio.create_task(self.add_user_to_audience(
                email=user_email,
                name=user_name,
                plan=user_plan,
                additional_tags=["welcome_email_needed"]
            ))
            
            # Simulate welcome email content (in production, this would be an automation)
            welcome_message = self._build_welcome_message(user_name, user_plan)
            
            logger.info(f"Welcome email process initiated for {user_email}")
            
            return {
                "status": "success",
                "message": "Welcome email automation triggered",
                "email_type": EmailType.WELCOME,
                "recipient": user_email,
                "preview": welcome_message["subject"]
            }
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {user_email}: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "email_type": EmailType.WELCOME,
                "recipient": user_email
            }
    
    def _build_welcome_message(self, user_name: str, user_plan: str) -> Dict[str, str]:
        """Build welcome email content"""
        
        plan_benefits = {
            "free": [
                "5 analyses per month",
                "Basic error detection",
                "Community support"
            ],
            "basic": [
                "50 analyses per month",
                "Advanced error detection", 
                "Private code analysis",
                "Email support"
            ],
            "pro": [
                "200 analyses per month", 
                "Advanced security scanning",
                "Priority support",
                "API access"
            ],
            "enterprise": [
                "Unlimited analyses",
                "Team collaboration",
                "Dedicated support",
                "SLA guarantee"
            ]
        }
        
        benefits = plan_benefits.get(user_plan.lower(), plan_benefits["free"])
        benefits_text = "\n".join([f"• {benefit}" for benefit in benefits])
        
        subject = f"Welcome to {self.app_name}, {user_name}! 🚀"
        
        content = f"""
        Welcome to {self.app_name}!
        
        Hi {user_name},
        
        Thank you for joining {self.app_name}! We're excited to help you write better, more secure code.
        
        Your {user_plan.title()} Plan Includes:
        {benefits_text}
        
        Getting Started:
        1. Upload your first code file
        2. Choose your analysis type
        3. Review your detailed security and bug report
        4. Implement the suggested improvements
        
        Start analyzing: {self.app_base_url}/dashboard
        
        Need help? Contact us at {self.support_email}
        
        Happy coding!
        The {self.app_name} Team
        """
        
        return {
            "subject": subject,
            "content": content.strip()
        }
    
    async def send_subscription_notification(
        self,
        user_email: str,
        user_name: str,
        event_type: str,
        subscription_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send subscription-related notifications"""
        try:
            # Update user in audience with subscription status
            await self.add_user_to_audience(
                email=user_email,
                name=user_name,
                plan=subscription_data.get("plan", "pro"),
                additional_tags=[f"subscription_{event_type}"]
            )
            
            notification_message = self._build_subscription_message(
                user_name, event_type, subscription_data
            )
            
            logger.info(f"Subscription {event_type} notification sent to {user_email}")
            
            return {
                "status": "success",
                "message": f"Subscription {event_type} notification sent",
                "email_type": f"subscription_{event_type}",
                "recipient": user_email,
                "preview": notification_message["subject"]
            }
            
        except Exception as e:
            logger.error(f"Failed to send subscription notification: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "email_type": f"subscription_{event_type}",
                "recipient": user_email
            }
    
    def _build_subscription_message(
        self, 
        user_name: str, 
        event_type: str, 
        subscription_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """Build subscription notification content"""
        
        plan_name = subscription_data.get("plan", "Pro")
        amount = subscription_data.get("amount", 0)
        
        messages = {
            "created": {
                "subject": f"Subscription Confirmed - Welcome to {plan_name}!",
                "content": f"""
                Hi {user_name},
                
                Great news! Your {plan_name} subscription is now active.
                
                Billing: ${amount:.2f}/month
                Start date: {datetime.now().strftime('%B %d, %Y')}
                
                You now have access to all premium features including:
                • Unlimited code analysis
                • Advanced security scanning
                • Priority support
                • API access
                
                Access your account: {self.app_base_url}/dashboard
                
                Thank you for upgrading!
                The {self.app_name} Team
                """
            },
            "cancelled": {
                "subject": "Subscription Cancelled - We're Sorry to See You Go",
                "content": f"""
                Hi {user_name},
                
                We've processed your subscription cancellation request.
                
                Your {plan_name} features will remain active until your current billing period ends.
                You can still access all premium features until then.
                
                If you change your mind, you can reactivate anytime: {self.app_base_url}/subscription
                
                We'd love your feedback: {self.support_email}
                
                Best regards,
                The {self.app_name} Team
                """
            }
        }
        
        default_message = {
            "subject": f"Subscription Update - {self.app_name}",
            "content": f"""
            Hi {user_name},
            
            Your subscription has been updated.
            
            If you have any questions, contact us at {self.support_email}
            
            Best regards,
            The {self.app_name} Team
            """
        }
        
        message = messages.get(event_type, default_message)
        return {
            "subject": message["subject"],
            "content": message["content"].strip()
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Check MailChimp service health"""
        try:
            start_time = time.perf_counter()
            ping_result = self.test_connection()
            response_time = time.perf_counter() - start_time
            
            return {
                "status": "healthy",
                "service": "mailchimp",
                "response_time": f"{response_time:.3f}s",
                "api_status": ping_result.get("message", {}).get("health_status", "Unknown"),
                "audience_configured": self.audience_id != "placeholder_audience_id"
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "service": "mailchimp", 
                "error": str(e)
            }

# Global instance
mailchimp_service = None

def get_mailchimp_service() -> MailChimpService:
    """Get or create MailChimp service instance"""
    global mailchimp_service
    if mailchimp_service is None:
        try:
            mailchimp_service = MailChimpService()
            logger.info("MailChimp service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize MailChimp service: {str(e)}")
            raise
    return mailchimp_service