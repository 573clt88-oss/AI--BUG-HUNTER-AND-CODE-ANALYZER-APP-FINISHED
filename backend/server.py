from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException, Form, Depends, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from enum import Enum
from mailchimp_service import get_mailchimp_service, MailChimpService

# Load environment variables - override system env with .env file
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="AI Bug Hunter & Code Analyzer SaaS", version="2.0.0")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Enums
class SubscriptionTier(str, Enum):
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    TRIALING = "trialing"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    firebase_uid: Optional[str] = None
    display_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    subscription_tier: SubscriptionTier = SubscriptionTier.FREE
    subscription_status: SubscriptionStatus = SubscriptionStatus.TRIALING
    monthly_analyses_used: int = 0
    monthly_limit: int = 10
    trial_ends_at: Optional[datetime] = None

class AnalysisResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
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

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    stripe_session_id: Optional[str] = None
    amount: float
    currency: str = "usd"
    status: PaymentStatus = PaymentStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Subscription Plans
SUBSCRIPTION_PLANS = {
    SubscriptionTier.FREE: {
        "id": "free",
        "name": "Free Tier",
        "monthly_price": 0.0,
        "monthly_limit": 5,
        "features": [
            "5 analyses per month",
            "Basic error detection", 
            "Public code analysis only",
            "Community support"
        ]
    },
    SubscriptionTier.BASIC: {
        "id": "basic",
        "name": "Basic Tier",
        "monthly_price": 9.0,
        "monthly_limit": 50,
        "features": [
            "50 analyses per month",
            "Advanced error detection",
            "Private code analysis", 
            "Email support",
            "Export reports"
        ]
    },
    SubscriptionTier.PRO: {
        "id": "pro",
        "name": "Pro Tier", 
        "monthly_price": 19.0,
        "monthly_limit": 200,
        "features": [
            "200 analyses per month",
            "Advanced security scanning",
            "Private repository support",
            "Priority support",
            "Detailed analytics",
            "API access"
        ]
    },
    SubscriptionTier.ENTERPRISE: {
        "id": "enterprise",
        "name": "Enterprise Tier",
        "monthly_price": 49.0,
        "monthly_limit": -1,
        "features": [
            "Unlimited analyses",
            "Team collaboration",
            "Custom integrations",
            "White-label reports", 
            "Dedicated support",
            "SLA guarantee"
        ]
    }
}

# Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
STRIPE_PRICE_IDS = {
    "basic": os.environ.get('STRIPE_BASIC_PRICE_ID', 'price_placeholder_basic'),
    "pro": os.environ.get('STRIPE_PRO_PRICE_ID', 'price_placeholder_pro'), 
    "enterprise": os.environ.get('STRIPE_ENTERPRISE_PRICE_ID', 'price_placeholder_enterprise')
}
STRIPE_PAYMENT_LINKS = {
    "basic": os.environ.get('STRIPE_BASIC_PAYMENT_LINK', ''),
    "pro": os.environ.get('STRIPE_PRO_PAYMENT_LINK', ''),
    "enterprise": os.environ.get('STRIPE_ENTERPRISE_PAYMENT_LINK', '')
}
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')

# Analysis template
ANALYSIS_TEMPLATE = """
You are an expert code analyzer and bug hunter. Analyze the provided code and return a JSON response with:
- "issues": array of issues found
- "suggestions": array of improvement suggestions  
- "security_score": number 0-100
- "code_quality_score": number 0-100
- "summary": brief summary text

Each issue should have: type, severity, description, suggestion
"""

async def analyze_code_with_ai(content: str, file_type: str, analysis_type: str) -> Dict[str, Any]:
    """Analyze code using AI - Demo version with smart pattern detection"""
    try:
        # For now, return a working demo analysis while we fix the Claude API
        # This analyzes the code using simple pattern matching
        
        issues = []
        security_score = 85
        code_quality_score = 80
        
        # Basic vulnerability detection
        if "SELECT * FROM" in content and ("+" in content or "f\"" in content):
            issues.append({
                "type": "security",
                "severity": "critical", 
                "line": content.split('\n').index([line for line in content.split('\n') if 'SELECT' in line][0]) + 1 if [line for line in content.split('\n') if 'SELECT' in line] else 1,
                "description": "SQL Injection vulnerability detected",
                "suggestion": "Use parameterized queries instead of string concatenation"
            })
            security_score = 30
            
        if "password" in content.lower() and ("input(" in content or "raw_input(" in content):
            issues.append({
                "type": "security", 
                "severity": "high",
                "line": 1,
                "description": "Plain text password handling detected",
                "suggestion": "Hash passwords and use secure input methods"
            })
            security_score = min(security_score, 50)
            
        if "eval(" in content or "exec(" in content:
            issues.append({
                "type": "security",
                "severity": "critical",
                "line": 1, 
                "description": "Code injection vulnerability - eval/exec detected",
                "suggestion": "Avoid using eval() or exec() with user input"
            })
            security_score = 20
            
        # Performance issues
        if "while True:" in content and "sleep" not in content:
            issues.append({
                "type": "performance",
                "severity": "medium",
                "line": 1,
                "description": "Infinite loop without delay detected",
                "suggestion": "Add sleep() or proper exit condition"
            })
            code_quality_score = min(code_quality_score, 60)
            
        # If no specific issues found, add some general observations
        if not issues:
            if len(content) < 50:
                issues.append({
                    "type": "style",
                    "severity": "low", 
                    "line": 1,
                    "description": "Code appears to be a simple snippet",
                    "suggestion": "Consider adding documentation and error handling"
                })
            else:
                issues.append({
                    "type": "style",
                    "severity": "low",
                    "line": 1,
                    "description": "Code structure looks good",
                    "suggestion": "Consider adding unit tests for better maintainability"
                })
        
        return {
            "issues": issues,
            "suggestions": [
                {"category": "Security", "description": "Always validate and sanitize user inputs", "impact": "High"},
                {"category": "Performance", "description": "Profile code for bottlenecks in production", "impact": "Medium"},
                {"category": "Maintainability", "description": "Add comprehensive documentation", "impact": "Medium"}
            ],
            "security_score": security_score,
            "code_quality_score": code_quality_score,
            "summary": f"Analysis completed. Found {len(issues)} issue(s). Security score: {security_score}/100, Quality score: {code_quality_score}/100.",
            "ai_model_used": "Pattern Analysis Engine (Demo Mode)"
        }
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        return {
            "issues": [{"type": "error", "severity": "high", "description": f"Analysis failed: {str(e)}", "suggestion": "Please try again"}],
            "suggestions": [],
            "security_score": 0,
            "code_quality_score": 0,
            "summary": f"Analysis failed: {str(e)}",
            "ai_model_used": "Pattern Analysis Engine (Demo Mode)"
        }

# Background Tasks
async def send_welcome_email_task(email: str, name: str, plan: str):
    """Background task to send welcome email via MailChimp"""
    try:
        mailchimp = get_mailchimp_service()
        result = mailchimp.send_welcome_email(email, name, plan)
        logger.info(f"Welcome email task completed for {email}: {result['status']}")
    except Exception as e:
        logger.error(f"Welcome email task failed for {email}: {str(e)}")

async def send_subscription_email_task(email: str, name: str, event_type: str, subscription_data: dict):
    """Background task to send subscription notification emails"""
    try:
        mailchimp = get_mailchimp_service()
        result = await mailchimp.send_subscription_notification(email, name, event_type, subscription_data)
        logger.info(f"Subscription {event_type} email sent to {email}: {result['status']}")
    except Exception as e:
        logger.error(f"Subscription email task failed for {email}: {str(e)}")

# Routes
@api_router.get("/")
async def root():
    return {"message": "AI Bug Hunter & Code Analyzer SaaS API", "version": "2.0.0", "status": "running"}

# User Authentication Routes
@api_router.post("/auth/register")
async def register_user(
    background_tasks: BackgroundTasks,
    email: EmailStr = Form(...),
    name: str = Form(...),
    plan: str = Form(default="free")
):
    """Register a new user and trigger welcome email"""
    try:
        # Create user record
        user_data = {
            "id": str(uuid.uuid4()),
            "email": email,
            "name": name,
            "plan": plan,
            "created_at": datetime.utcnow(),
            "trial_start": datetime.utcnow(),
            "trial_end": datetime.utcnow() + timedelta(days=7) if plan == "free" else None,
            "subscription_status": "trialing" if plan == "free" else "active",
            "analysis_count": 0
        }
        
        # Insert user into database
        await db.users.insert_one(user_data)
        
        # Send welcome email in background
        background_tasks.add_task(
            send_welcome_email_task, 
            email, 
            name, 
            plan
        )
        
        logger.info(f"User registered: {email}, plan: {plan}")
        
        return {
            "status": "success",
            "message": "User registered successfully",
            "user_id": user_data["id"],
            "plan": plan,
            "welcome_email": "scheduled"
        }
        
    except Exception as e:
        logger.error(f"User registration failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

@api_router.post("/auth/login")
async def login_user(
    email: EmailStr = Form(...),
    password: str = Form(default="demo")
):
    """Simple login for demo purposes"""
    try:
        # Find user in database
        user = await db.users.find_one({"email": email})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # In demo mode, accept any password
        # In production, verify actual password hash
        
        return {
            "status": "success",
            "message": "Login successful", 
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "plan": user.get("plan", "free"),
                "subscription_status": user.get("subscription_status", "trialing")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@api_router.get("/subscription/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    return {"plans": list(SUBSCRIPTION_PLANS.values())}

@api_router.get("/subscription/tiers")
async def get_available_tiers():
    """Get subscription tiers available for checkout"""
    available_tiers = []
    
    for tier_key, tier_data in SUBSCRIPTION_PLANS.items():
        if tier_key == SubscriptionTier.FREE:
            continue  # Skip free tier for checkout
            
        payment_link = STRIPE_PAYMENT_LINKS.get(tier_key.value, "")
        is_available = payment_link and "placeholder" not in payment_link and payment_link.startswith("https://buy.stripe.com/")
        
        available_tiers.append({
            "id": tier_key.value,
            "name": tier_data["name"],
            "price": tier_data["monthly_price"],
            "features": tier_data["features"],
            "limit": tier_data["monthly_limit"],
            "available_for_purchase": is_available,
            "payment_method": "stripe_payment_link" if is_available else "not_configured",
            "payment_link": payment_link if is_available else None
        })
    
    return {"tiers": available_tiers}

@api_router.post("/subscription/checkout")
async def create_subscription_checkout(
    request: Request,
    tier: str = Form(...),
    user_email: str = Form(default="demo@example.com")
):
    """Get Stripe payment link for any subscription tier"""
    try:
        # Validate tier
        if tier not in ["basic", "pro", "enterprise"]:
            raise HTTPException(status_code=400, detail="Invalid subscription tier")
        
        # Get payment link for the tier
        payment_link = STRIPE_PAYMENT_LINKS.get(tier)
        if not payment_link or "placeholder" in payment_link:
            raise HTTPException(status_code=400, detail=f"Payment link not configured for {tier} tier")
        
        # Get plan details
        plan_details = SUBSCRIPTION_PLANS.get(tier)
        if not plan_details:
            raise HTTPException(status_code=400, detail=f"Plan details not found for {tier}")
        
        # Create pending payment record for tracking
        payment_id = str(uuid.uuid4())
        payment = PaymentTransaction(
            id=payment_id,
            stripe_session_id=f"payment_link_{payment_id}",
            amount=plan_details["monthly_price"],
            currency="usd",
            status=PaymentStatus.PENDING
        )
        await db.payment_transactions.insert_one(payment.dict())
        
        logger.info(f"Payment link generated for {tier} tier: {user_email}")
        
        return {
            "payment_link": payment_link,
            "tier": tier,
            "plan_name": plan_details["name"],
            "monthly_price": plan_details["monthly_price"],
            "payment_id": payment_id,
            "redirect_url": payment_link
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment link error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment link generation failed: {str(e)}")

@api_router.get("/subscription/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    """Check payment status"""
    try:
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        status_response = await stripe_checkout.get_checkout_status(session_id)
        
        # Update payment record
        if status_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"stripe_session_id": session_id},
                {"$set": {"status": PaymentStatus.COMPLETED}}
            )
        
        return status_response
        
    except Exception as e:
        logger.error(f"Status check error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Handle Stripe webhooks and trigger subscription emails
    
    IMPORTANT: Before using in production:
    1. Configure webhook URL in Stripe Dashboard: https://your-domain.com/api/webhook/stripe
    2. Add STRIPE_WEBHOOK_SECRET to environment variables
    3. See WEBHOOK_SETUP.md for detailed setup instructions
    
    Currently handles: checkout.session.completed
    """
    try:
        body = await request.body()
        stripe_signature = request.headers.get("Stripe-Signature")
        
        # Note: webhook_url parameter is not used for signature verification
        # The signature is verified using STRIPE_WEBHOOK_SECRET env variable
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
        
        if webhook_response.event_type == "checkout.session.completed":
            # Update payment status
            await db.payment_transactions.update_one(
                {"stripe_session_id": webhook_response.session_id},
                {"$set": {"status": PaymentStatus.COMPLETED}}
            )
            
            # Try to find user and send subscription confirmation email
            # In a real app, we'd store user info with the session
            # For now, we'll use a demo approach
            try:
                subscription_data = {
                    "plan": "pro",
                    "amount": 19.0,
                    "currency": "usd",
                    "created_at": datetime.utcnow().isoformat()
                }
                
                # In production, get actual user email from session metadata
                # For demo, we'll skip this unless user email is available
                logger.info(f"Subscription completed for session: {webhook_response.session_id}")
                
                # Background task would be triggered here with actual user email
                # background_tasks.add_task(
                #     send_subscription_email_task,
                #     user_email, user_name, "created", subscription_data
                # )
                
            except Exception as email_error:
                logger.error(f"Subscription email error: {str(email_error)}")
        
        return {"received": True}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"error": str(e)}

@api_router.post("/analyze/upload", response_model=AnalysisResult)
async def analyze_uploaded_file(
    file: UploadFile = File(...),
    analysis_type: str = Form(default="comprehensive")
):
    """Analyze uploaded code file"""
    try:
        # Validate file exists and has a filename
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided or file has no name")
            
        # Check file size (max 10MB for code files)
        if file.size and file.size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        # File type validation
        allowed_extensions = {
            '.py': 'python', '.js': 'javascript', '.ts': 'typescript',
            '.java': 'java', '.cpp': 'cpp', '.c': 'c', '.cs': 'csharp',
            '.php': 'php', '.rb': 'ruby', '.go': 'go', '.rs': 'rust',
            '.yml': 'yaml', '.yaml': 'yaml', '.json': 'json', '.xml': 'xml',
            '.html': 'html', '.css': 'css', '.sh': 'bash', '.sql': 'sql'
        }
        
        file_extension = Path(file.filename).suffix.lower()
        if not file_extension:
            raise HTTPException(status_code=400, detail="File must have a valid extension")
            
        if file_extension not in allowed_extensions:
            supported_types = ', '.join(allowed_extensions.keys())
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_extension}. Supported types: {supported_types}")
            
        file_type = allowed_extensions[file_extension]
        
        # Read and analyze
        content = await file.read()
        
        # Check if file is empty
        if not content:
            raise HTTPException(status_code=400, detail="File is empty")
            
        # Try different encodings
        try:
            content_str = content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                content_str = content.decode('latin-1')
            except UnicodeDecodeError:
                try:
                    content_str = content.decode('cp1252')
                except UnicodeDecodeError:
                    raise HTTPException(status_code=400, detail="File encoding not supported. Please use UTF-8 encoded files.")
        
        # Check if decoded content is meaningful
        if not content_str.strip():
            raise HTTPException(status_code=400, detail="File contains no readable content")
        
        analysis_result = await analyze_code_with_ai(content_str, file_type, analysis_type)
        
        # Create result
        result = AnalysisResult(
            file_name=file.filename,
            file_type=file_type,
            analysis_type=analysis_type,
            issues=analysis_result.get("issues", []),
            suggestions=analysis_result.get("suggestions", []),
            security_score=analysis_result.get("security_score", 0),
            code_quality_score=analysis_result.get("code_quality_score", 0),
            summary=analysis_result.get("summary", "Analysis completed"),
            ai_model_used=analysis_result.get("ai_model_used", "claude-3-5-sonnet-20241022")
        )
        
        # Save to database
        await db.analysis_results.insert_one(result.dict())
        return result
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/analyze/text", response_model=AnalysisResult)
async def analyze_text_code(request: dict):
    """Analyze code from text input"""
    try:
        logger.info(f"Text analysis request received: {len(str(request))} chars")
        file_content = request.get("file_content", "")
        file_type = request.get("file_type", "")
        analysis_type = request.get("analysis_type", "comprehensive")
        
        if not file_content or not file_type:
            raise HTTPException(status_code=400, detail="Missing content or file type")
        
        analysis_result = await analyze_code_with_ai(file_content, file_type, analysis_type)
        
        result = AnalysisResult(
            file_name="text_input",
            file_type=file_type,
            analysis_type=analysis_type,
            issues=analysis_result.get("issues", []),
            suggestions=analysis_result.get("suggestions", []),
            security_score=analysis_result.get("security_score", 0),
            code_quality_score=analysis_result.get("code_quality_score", 0),
            summary=analysis_result.get("summary", "Analysis completed"),
            ai_model_used=analysis_result.get("ai_model_used", "claude-3-5-sonnet-20241022")
        )
        
        await db.analysis_results.insert_one(result.dict())
        return result
        
    except Exception as e:
        logger.error(f"Text analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analysis/result/{result_id}")
async def get_analysis_result(result_id: str):
    """Get specific analysis result"""
    try:
        result = await db.analysis_results.find_one({"id": result_id})
        if not result:
            raise HTTPException(status_code=404, detail="Result not found")
        
        # Remove MongoDB ObjectId to prevent serialization issues
        if "_id" in result:
            del result["_id"]
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Result retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analysis/history")
async def get_analysis_history():
    """Get user's analysis history"""
    return []

@api_router.get("/supported-languages")
async def get_supported_languages():
    """Get supported languages"""
    return {
        "languages": [
            {"name": "Python", "extension": ".py", "type": "python"},
            {"name": "JavaScript", "extension": ".js", "type": "javascript"},
            {"name": "TypeScript", "extension": ".ts", "type": "typescript"},
            {"name": "Java", "extension": ".java", "type": "java"},
            {"name": "C++", "extension": ".cpp", "type": "cpp"},
            {"name": "C", "extension": ".c", "type": "c"},
            {"name": "C#", "extension": ".cs", "type": "csharp"},
            {"name": "PHP", "extension": ".php", "type": "php"},
            {"name": "Ruby", "extension": ".rb", "type": "ruby"},
            {"name": "Go", "extension": ".go", "type": "go"},
            {"name": "Rust", "extension": ".rs", "type": "rust"}
        ]
    }

@api_router.get("/analysis-types")
async def get_analysis_types():
    """Get analysis types"""
    return {
        "types": [
            {"id": "comprehensive", "name": "Comprehensive Analysis", "description": "Complete analysis"},
            {"id": "security", "name": "Security Analysis", "description": "Security focused"},
            {"id": "bugs", "name": "Bug Detection", "description": "Find bugs"},
            {"id": "performance", "name": "Performance Analysis", "description": "Performance issues"},
            {"id": "style", "name": "Code Style", "description": "Style and maintainability"}
        ]
    }

@api_router.get("/supported-languages")
async def get_supported_languages():
    """Get supported programming languages"""
    return {
        "languages": [
            {"id": "python", "name": "Python", "extension": ".py"},
            {"id": "javascript", "name": "JavaScript", "extension": ".js"},
            {"id": "typescript", "name": "TypeScript", "extension": ".ts"},
            {"id": "java", "name": "Java", "extension": ".java"},
            {"id": "cpp", "name": "C++", "extension": ".cpp"},
            {"id": "c", "name": "C", "extension": ".c"},
            {"id": "csharp", "name": "C#", "extension": ".cs"},
            {"id": "php", "name": "PHP", "extension": ".php"},
            {"id": "ruby", "name": "Ruby", "extension": ".rb"},
            {"id": "go", "name": "Go", "extension": ".go"},
            {"id": "rust", "name": "Rust", "extension": ".rs"},
            {"id": "yaml", "name": "YAML", "extension": ".yml"},
            {"id": "json", "name": "JSON", "extension": ".json"},
            {"id": "xml", "name": "XML", "extension": ".xml"},
            {"id": "html", "name": "HTML", "extension": ".html"},
            {"id": "css", "name": "CSS", "extension": ".css"},
            {"id": "bash", "name": "Bash", "extension": ".sh"},
            {"id": "sql", "name": "SQL", "extension": ".sql"}
        ]
    }

# MailChimp Integration Endpoints
@api_router.get("/mailchimp/health")
async def mailchimp_health_check():
    """Check MailChimp service health"""
    try:
        mailchimp = get_mailchimp_service()
        health = await mailchimp.health_check()
        return health
    except Exception as e:
        logger.error(f"MailChimp health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "mailchimp",
            "error": str(e)
        }

@api_router.post("/admin/send-test-email")
async def send_test_email(
    background_tasks: BackgroundTasks,
    email: EmailStr = Form(...),
    name: str = Form(...),
    email_type: str = Form(default="welcome")
):
    """Send test email for admin testing"""
    try:
        if email_type == "welcome":
            background_tasks.add_task(send_welcome_email_task, email, name, "free")
        elif email_type == "subscription":
            subscription_data = {
                "plan": "pro",
                "amount": 19.0,
                "created_at": datetime.utcnow().isoformat()
            }
            background_tasks.add_task(send_subscription_email_task, email, name, "created", subscription_data)
        else:
            raise HTTPException(status_code=400, detail="Invalid email type")
            
        return {
            "status": "success",
            "message": f"Test {email_type} email scheduled for {email}"
        }
        
    except HTTPException:
        raise  # Re-raise HTTPException as-is
    except Exception as e:
        logger.error(f"Test email error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send test email: {str(e)}")

@api_router.post("/mailchimp/add-user")
async def add_user_to_mailchimp(
    email: EmailStr = Form(...),
    name: str = Form(...),
    plan: str = Form(default="free")
):
    """Manually add user to MailChimp audience"""
    try:
        mailchimp = get_mailchimp_service()
        result = await mailchimp.add_user_to_audience(email, name, plan)
        return result
    except Exception as e:
        logger.error(f"Failed to add user to MailChimp: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Analytics Endpoints
@api_router.get("/analytics/user/{user_id}")
async def get_user_analytics(user_id: str):
    """Get analytics for a specific user"""
    try:
        # Get user data
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's analyses
        analyses = await db.analysis_results.find({"user_id": user_id}).to_list(length=None)
        
        # Calculate statistics
        total_analyses = len(analyses)
        
        # Group analyses by date for trends
        from collections import defaultdict
        analyses_by_date = defaultdict(int)
        issues_by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        total_security_score = 0
        total_quality_score = 0
        languages_used = defaultdict(int)
        
        for analysis in analyses:
            # Date grouping
            date_key = analysis.get("timestamp", datetime.utcnow()).strftime("%Y-%m-%d")
            analyses_by_date[date_key] += 1
            
            # Language tracking
            file_type = analysis.get("file_type", "unknown")
            languages_used[file_type] += 1
            
            # Scores
            total_security_score += analysis.get("security_score", 0)
            total_quality_score += analysis.get("code_quality_score", 0)
            
            # Issues by severity
            for issue in analysis.get("issues", []):
                severity = issue.get("severity", "low")
                if severity in issues_by_severity:
                    issues_by_severity[severity] += 1
        
        avg_security_score = total_security_score / total_analyses if total_analyses > 0 else 0
        avg_quality_score = total_quality_score / total_analyses if total_analyses > 0 else 0
        
        # Get recent analyses (last 10)
        recent_analyses = sorted(analyses, key=lambda x: x.get("timestamp", datetime.min), reverse=True)[:10]
        recent_analyses_formatted = [
            {
                "id": a.get("id"),
                "file_name": a.get("file_name"),
                "file_type": a.get("file_type"),
                "timestamp": a.get("timestamp").isoformat() if a.get("timestamp") else None,
                "security_score": a.get("security_score"),
                "code_quality_score": a.get("code_quality_score"),
                "issues_count": len(a.get("issues", []))
            }
            for a in recent_analyses
        ]
        
        return {
            "user_id": user_id,
            "subscription_tier": user.get("subscription_tier", "free"),
            "monthly_limit": user.get("monthly_limit", 10),
            "monthly_analyses_used": user.get("monthly_analyses_used", 0),
            "total_analyses": total_analyses,
            "avg_security_score": round(avg_security_score, 2),
            "avg_quality_score": round(avg_quality_score, 2),
            "issues_by_severity": issues_by_severity,
            "languages_used": dict(languages_used),
            "analyses_by_date": dict(analyses_by_date),
            "recent_analyses": recent_analyses_formatted
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/admin/overview")
async def get_admin_overview():
    """Get platform-wide analytics overview (admin only)"""
    try:
        # Count total users
        total_users = await db.users.count_documents({})
        
        # Count active subscriptions (non-free tiers)
        active_subscriptions = await db.users.count_documents({
            "subscription_tier": {"$ne": "free"}
        })
        
        # Count analyses
        total_analyses = await db.analysis_results.count_documents({})
        
        # Get current month analyses
        from datetime import timezone
        first_day_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        analyses_this_month = await db.analysis_results.count_documents({
            "timestamp": {"$gte": first_day_of_month}
        })
        
        # Calculate revenue (sum of completed payments)
        payments = await db.payment_transactions.find({"status": "completed"}).to_list(length=None)
        monthly_revenue = sum(p.get("amount", 0) for p in payments)
        
        # Calculate conversion rate (paid users / total users)
        conversion_rate = (active_subscriptions / total_users * 100) if total_users > 0 else 0
        
        # Get subscription breakdown
        subscription_breakdown = {
            "free": await db.users.count_documents({"subscription_tier": "free"}),
            "basic": await db.users.count_documents({"subscription_tier": "basic"}),
            "pro": await db.users.count_documents({"subscription_tier": "pro"}),
            "enterprise": await db.users.count_documents({"subscription_tier": "enterprise"})
        }
        
        # Get recent user signups (last 30 days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        new_users = await db.users.count_documents({
            "created_at": {"$gte": thirty_days_ago}
        })
        
        return {
            "total_users": total_users,
            "active_subscriptions": active_subscriptions,
            "monthly_revenue": round(monthly_revenue, 2),
            "total_analyses": total_analyses,
            "analyses_this_month": analyses_this_month,
            "conversion_rate": round(conversion_rate, 2),
            "subscription_breakdown": subscription_breakdown,
            "new_users_last_30_days": new_users
        }
        
    except Exception as e:
        logger.error(f"Admin analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/admin/trends")
async def get_admin_trends():
    """Get platform-wide trend data for charts"""
    try:
        # Get analyses for the last 30 days grouped by date
        from datetime import timezone
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        
        analyses = await db.analysis_results.find({
            "timestamp": {"$gte": thirty_days_ago}
        }).to_list(length=None)
        
        users = await db.users.find({
            "created_at": {"$gte": thirty_days_ago}
        }).to_list(length=None)
        
        # Group by date
        from collections import defaultdict
        analyses_by_date = defaultdict(int)
        users_by_date = defaultdict(int)
        
        for analysis in analyses:
            date_key = analysis.get("timestamp", datetime.utcnow()).strftime("%Y-%m-%d")
            analyses_by_date[date_key] += 1
        
        for user in users:
            date_key = user.get("created_at", datetime.utcnow()).strftime("%Y-%m-%d")
            users_by_date[date_key] += 1
        
        # Generate date range for last 30 days
        date_range = []
        for i in range(30):
            date = (datetime.now(timezone.utc) - timedelta(days=29-i)).strftime("%Y-%m-%d")
            date_range.append({
                "date": date,
                "analyses": analyses_by_date.get(date, 0),
                "new_users": users_by_date.get(date, 0)
            })
        
        return {
            "trends": date_range
        }
        
    except Exception as e:
        logger.error(f"Trends analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test database connection
        await db.users.find_one()
        
        return {
            "status": "healthy",
            "service": "AI Bug Hunter & Code Analyzer",
            "version": "2.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "AI Bug Hunter & Code Analyzer", 
            "version": "2.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error": str(e)
        }

@api_router.get("/version")
async def get_version():
    """Get API version information"""
    return {
        "version": "2.0.0",
        "api_version": "v1",
        "environment": os.environ.get("ENVIRONMENT", "development"),
        "last_updated": "2025-10-10"
    }

# Include router
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "http://localhost:3000",
        "https://codebugsleuth.preview.emergentagent.com",
        "https://codebugsleuth.preview.emergentagent.com"
    ],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)