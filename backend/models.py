# Database Models for AI Bug Hunter SaaS Platform
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

# Enums for subscription tiers
class SubscriptionTier(str, Enum):
    FREE = "free"
    PRO = "pro"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled" 
    PAST_DUE = "past_due"
    TRIALING = "trialing"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

# User Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    firebase_uid: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_admin: bool = False
    
    # Subscription info
    subscription_tier: SubscriptionTier = SubscriptionTier.FREE
    subscription_status: SubscriptionStatus = SubscriptionStatus.TRIALING
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    trial_ends_at: Optional[datetime] = None
    subscription_ends_at: Optional[datetime] = None
    
    # Usage tracking
    monthly_analyses_used: int = 0
    monthly_limit: int = 10  # Free tier default
    last_reset_date: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: EmailStr
    firebase_uid: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    photo_url: Optional[str] = None

# Subscription Models
class SubscriptionPlan(BaseModel):
    id: str
    name: str
    tier: SubscriptionTier
    monthly_price: float
    monthly_limit: int
    features: List[str]
    stripe_price_id: Optional[str] = None

class Subscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    tier: SubscriptionTier
    status: SubscriptionStatus
    stripe_subscription_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Payment Models
class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    stripe_session_id: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None
    amount: float
    currency: str = "usd"
    status: PaymentStatus = PaymentStatus.PENDING
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

# Analysis Models (Enhanced)
class AnalysisRequest(BaseModel):
    file_content: str
    file_type: str
    analysis_type: str = "comprehensive"

class AnalysisResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    file_name: str
    file_type: str
    analysis_type: str
    issues: List[Dict[str, Any]]
    suggestions: List[Dict[str, Any]]
    security_score: int
    code_quality_score: int
    summary: str
    ai_model_used: str
    processing_time: Optional[float] = None

class AnalysisHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    file_name: str
    file_type: str
    analysis_type: str
    result_id: str
    status: str

# Usage Tracking Models
class UsageRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    action: str  # "analysis", "file_upload", etc.
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = None

# Admin Models
class AdminStats(BaseModel):
    total_users: int
    active_subscriptions: int
    monthly_revenue: float
    total_analyses: int
    analyses_this_month: int
    conversion_rate: float

class SupportTicket(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    email: EmailStr
    subject: str
    message: str
    status: str = "open"  # open, in_progress, resolved, closed
    priority: str = "normal"  # low, normal, high, urgent
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    admin_response: Optional[str] = None

# Subscription tier configurations
SUBSCRIPTION_PLANS = {
    SubscriptionTier.FREE: SubscriptionPlan(
        id="free",
        name="Free Tier",
        tier=SubscriptionTier.FREE,
        monthly_price=0.0,
        monthly_limit=10,
        features=[
            "10 analyses per month",
            "Basic error detection", 
            "Public code analysis only",
            "Email support"
        ]
    ),
    SubscriptionTier.PRO: SubscriptionPlan(
        id="pro",
        name="Pro Tier", 
        tier=SubscriptionTier.PRO,
        monthly_price=19.0,
        monthly_limit=-1,  # Unlimited
        features=[
            "Unlimited code analyses",
            "Advanced security scanning",
            "Private repository support",
            "Priority support",
            "Detailed analytics",
            "Custom analysis rules",
            "Team collaboration"
        ],
        stripe_price_id="price_pro_monthly"  # Will be set from Stripe
    )
}