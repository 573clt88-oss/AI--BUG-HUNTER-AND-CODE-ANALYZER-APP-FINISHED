from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException, Form, Depends, Request
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
from datetime import datetime, timedelta
import tempfile
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

# Import our custom modules
from models import (
    User, SubscriptionTier, SubscriptionStatus, SUBSCRIPTION_PLANS,
    AnalysisResult, AnalysisHistory, PaymentTransaction, PaymentStatus,
    UsageRecord, AdminStats, SupportTicket, UserCreate, UserUpdate
)
from auth import get_current_user, get_optional_user, get_admin_user, AuthenticatedUser
from subscription_service import SubscriptionService

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="AI Bug Hunter & Code Analyzer SaaS", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize services
subscription_service = SubscriptionService(db)

# Stripe configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
STRIPE_PRO_PRICE_ID = os.environ.get('STRIPE_PRO_PRICE_ID', 'price_placeholder_update_later')

# AI Configuration
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Analysis Templates (same as before)
ANALYSIS_TEMPLATES = {
    "comprehensive": """
    You are an expert code analyzer and bug hunter. Analyze the provided code and provide:
    
    1. **Critical Issues**: Security vulnerabilities, potential crashes, memory leaks
    2. **Bugs**: Logic errors, edge cases, type mismatches
    3. **Performance Issues**: Inefficient algorithms, resource usage problems
    4. **Code Quality**: Style issues, readability problems, maintainability concerns
    5. **Best Practices**: Suggestions for improvement
    
    For each issue found, provide:
    - Severity level (Critical, High, Medium, Low)
    - Line number (if applicable)
    - Description of the issue
    - Suggested fix
    - Code example if helpful
    
    Also provide:
    - Overall security score (0-100)
    - Overall code quality score (0-100)
    - Summary of key findings
    
    Format your response as JSON with the following structure:
    {
        "issues": [{"type": "bug|security|performance|style", "severity": "critical|high|medium|low", "line": number, "description": "...", "suggestion": "..."}],
        "suggestions": [{"category": "...", "description": "...", "impact": "..."}],
        "security_score": number,
        "code_quality_score": number,
        "summary": "..."
    }
    """,
    
    "security": """
    You are a cybersecurity expert specializing in code analysis. Focus specifically on security vulnerabilities:
    
    1. **Injection Attacks**: SQL injection, XSS, command injection
    2. **Authentication Issues**: Weak auth, session management problems
    3. **Data Exposure**: Sensitive data leaks, improper encryption
    4. **Input Validation**: Missing or weak validation
    5. **Access Control**: Authorization bypasses, privilege escalation
    
    Provide detailed security assessment with OWASP Top 10 mappings where applicable.
    """,
    
    "bugs": """
    You are a debugging expert. Focus on finding functional bugs:
    
    1. **Logic Errors**: Incorrect algorithms, wrong conditions
    2. **Type Issues**: Type mismatches, casting problems
    3. **Edge Cases**: Null pointer exceptions, boundary conditions
    4. **Concurrency Issues**: Race conditions, deadlocks
    5. **Error Handling**: Missing try-catch, improper error propagation
    """,
    
    "performance": """
    You are a performance optimization expert. Focus on performance issues:
    
    1. **Algorithmic Complexity**: O(n²) where O(n) possible
    2. **Memory Usage**: Memory leaks, unnecessary allocations
    3. **I/O Operations**: Inefficient database queries, file operations
    4. **Caching**: Missing caching opportunities
    5. **Resource Management**: Connection pooling, cleanup issues
    """,
    
    "style": """
    You are a code style and maintainability expert. Focus on:
    
    1. **Coding Standards**: Naming conventions, formatting
    2. **Code Structure**: Organization, modularity
    3. **Documentation**: Missing comments, unclear variable names
    4. **Design Patterns**: Appropriate pattern usage
    5. **Maintainability**: Code duplication, long functions/classes
    """
}

async def analyze_code_with_ai(content: str, file_type: str, analysis_type: str) -> Dict[str, Any]:
    """Analyze code using AI"""
    try:
        # Initialize LLM chat - use personal Anthropic key for reliability
        api_key_to_use = ANTHROPIC_API_KEY if ANTHROPIC_API_KEY else EMERGENT_LLM_KEY
        chat = LlmChat(
            api_key=api_key_to_use,
            session_id=f"analysis_{uuid.uuid4()}",
            system_message=ANALYSIS_TEMPLATES.get(analysis_type, ANALYSIS_TEMPLATES["comprehensive"])
        ).with_model("anthropic", "claude-3-5-sonnet-20241022")
        
        # Create analysis prompt
        prompt = f"""
        Analyze this {file_type} code for {analysis_type} issues:
        
        ```{file_type}
        {content}
        ```
        
        Provide a comprehensive analysis following the JSON format specified in the system message.
        """
        
        # Send message and get response
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse response (assuming it's JSON formatted)
        try:
            import json
            result = json.loads(response)
            result["ai_model_used"] = "claude-3-5-sonnet-20241022"
            return result
        except json.JSONDecodeError:
            # Fallback if response isn't valid JSON
            return {
                "issues": [{"type": "analysis", "severity": "info", "line": 0, "description": "AI analysis completed", "suggestion": response[:500]}],
                "suggestions": [],
                "security_score": 75,
                "code_quality_score": 80,
                "summary": response[:200] + "..." if len(response) > 200 else response,
                "ai_model_used": "claude-3-5-sonnet-20241022"
            }
            
    except Exception as e:
        logger.error(f"AI analysis error: {str(e)}")
        return {
            "issues": [{"type": "error", "severity": "high", "line": 0, "description": f"Analysis failed: {str(e)}", "suggestion": "Please try again or contact support"}],
            "suggestions": [],
            "security_score": 0,
            "code_quality_score": 0,
            "summary": f"Analysis failed due to: {str(e)}",
            "ai_model_used": "claude-3-5-sonnet-20241022"
        }

# ============================================================================
# USER MANAGEMENT ROUTES
# ============================================================================

@api_router.post("/auth/register", response_model=User)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    try:
        user = await subscription_service.create_user(
            firebase_uid=user_data.firebase_uid,
            email=user_data.email,
            display_name=user_data.display_name
        )
        return user
    except Exception as e:
        logger.error(f"User registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@api_router.get("/auth/profile", response_model=User)
async def get_user_profile(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Get current user profile"""
    user = await subscription_service.get_user(current_user.uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/auth/profile", response_model=User)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Update user profile"""
    user = await subscription_service.get_user(current_user.uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user data
    update_data = user_update.dict(exclude_unset=True)
    await db.users.update_one(
        {"firebase_uid": current_user.uid},
        {"$set": update_data}
    )
    
    # Return updated user
    updated_user = await subscription_service.get_user(current_user.uid)
    return updated_user

@api_router.get("/auth/usage")
async def get_usage_info(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Get user usage information"""
    user = await subscription_service.get_user(current_user.uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    usage_info = await subscription_service.check_usage_limit(user)
    return usage_info

# ============================================================================
# SUBSCRIPTION & BILLING ROUTES
# ============================================================================

@api_router.get("/subscription/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    return {"plans": [plan.dict() for plan in SUBSCRIPTION_PLANS.values()]}

@api_router.post("/subscription/checkout", response_model=CheckoutSessionResponse)
async def create_subscription_checkout(
    request: Request,
    tier: SubscriptionTier = SubscriptionTier.PRO,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Create Stripe checkout session for subscription"""
    try:
        user = await subscription_service.get_user(current_user.uid)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user already has this tier
        if user.subscription_tier == tier and user.subscription_status == SubscriptionStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="User already has this subscription tier")
        
        # Get plan details
        plan = SUBSCRIPTION_PLANS.get(tier)
        if not plan or tier == SubscriptionTier.FREE:
            raise HTTPException(status_code=400, detail="Invalid subscription plan")
        
        # Initialize Stripe checkout
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Create checkout session
        success_url = f"{host_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{host_url}/subscription/cancel"
        
        checkout_request = CheckoutSessionRequest(
            stripe_price_id=STRIPE_PRO_PRICE_ID,  # Will update when you provide the real price ID
            quantity=1,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user.id,
                "tier": tier,
                "firebase_uid": user.firebase_uid
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Save payment transaction
        payment = PaymentTransaction(
            user_id=user.id,
            stripe_session_id=session.session_id,
            amount=plan.monthly_price,
            currency="usd",
            status=PaymentStatus.PENDING,
            description=f"Subscription to {plan.name}",
            metadata={
                "tier": tier,
                "plan_id": plan.id
            }
        )
        await db.payment_transactions.insert_one(payment.dict())
        
        logger.info(f"Created checkout session for user {user.email}: {session.session_id}")
        return session
        
    except Exception as e:
        logger.error(f"Checkout creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")

@api_router.get("/subscription/checkout/status/{session_id}")
async def get_checkout_status(
    session_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Check payment status"""
    try:
        # Initialize Stripe checkout
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        
        # Get checkout status
        status_response = await stripe_checkout.get_checkout_status(session_id)
        
        # Update local payment record
        payment = await db.payment_transactions.find_one({"stripe_session_id": session_id})
        if payment:
            update_data = {
                "status": PaymentStatus.COMPLETED if status_response.payment_status == "paid" else PaymentStatus.PENDING,
                "updated_at": datetime.utcnow()
            }
            
            if status_response.payment_status == "paid" and payment["status"] == PaymentStatus.PENDING:
                # First time seeing this as paid - upgrade user
                user = await subscription_service.get_user_by_id(payment["user_id"])
                if user:
                    await subscription_service.upgrade_to_pro(
                        user, 
                        status_response.metadata.get("customer_id", ""),
                        session_id
                    )
                update_data["completed_at"] = datetime.utcnow()
            
            await db.payment_transactions.update_one(
                {"stripe_session_id": session_id},
                {"$set": update_data}
            )
        
        return status_response
        
    except Exception as e:
        logger.error(f"Checkout status error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get checkout status")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        body = await request.body()
        stripe_signature = request.headers.get("Stripe-Signature")
        
        # Initialize Stripe checkout for webhook handling
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
        
        # Process different event types
        if webhook_response.event_type == "checkout.session.completed":
            # Handle successful checkout
            payment = await db.payment_transactions.find_one({
                "stripe_session_id": webhook_response.session_id
            })
            
            if payment and payment["status"] == PaymentStatus.PENDING:
                # Update payment status
                await db.payment_transactions.update_one(
                    {"stripe_session_id": webhook_response.session_id},
                    {"$set": {
                        "status": PaymentStatus.COMPLETED,
                        "completed_at": datetime.utcnow()
                    }}
                )
                
                # Upgrade user
                user = await subscription_service.get_user_by_id(payment["user_id"])
                if user:
                    await subscription_service.upgrade_to_pro(
                        user,
                        webhook_response.metadata.get("customer_id", ""),
                        webhook_response.session_id
                    )
        
        return {"received": True}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

@api_router.post("/subscription/cancel")
async def cancel_subscription(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Cancel user subscription"""
    user = await subscription_service.get_user(current_user.uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    success = await subscription_service.cancel_subscription(user)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")
    
    return {"message": "Subscription cancelled successfully"}

# ============================================================================
# CODE ANALYSIS ROUTES (Enhanced with subscription checks)
# ============================================================================

@api_router.post("/analyze/upload", response_model=AnalysisResult)
async def analyze_uploaded_file(
    file: UploadFile = File(...),
    analysis_type: str = Form(default="comprehensive"),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """Analyze uploaded code file"""
    try:
        # Check user limits if authenticated
        if current_user:
            user = await subscription_service.get_user(current_user.uid)
            if user:
                # Check if user can perform analysis
                can_analyze = await subscription_service.record_analysis(user)
                if not can_analyze:
                    usage_info = await subscription_service.check_usage_limit(user)
                    raise HTTPException(
                        status_code=402, 
                        detail={
                            "error": "Usage limit exceeded",
                            "remaining": usage_info["remaining"],
                            "limit": usage_info["limit"],
                            "tier": usage_info["tier"]
                        }
                    )
        
        # Validate file type
        allowed_extensions = {
            '.py': 'python',
            '.js': 'javascript', 
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.php': 'php',
            '.rb': 'ruby',
            '.go': 'go',
            '.rs': 'rust',
            '.kt': 'kotlin',
            '.swift': 'swift',
            '.html': 'html',
            '.css': 'css',
            '.sql': 'sql',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml'
        }
        
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_extension}")
            
        file_type = allowed_extensions[file_extension]
        
        # Read file content
        content = await file.read()
        content_str = content.decode('utf-8')
        
        # Analyze with AI
        start_time = datetime.utcnow()
        analysis_result = await analyze_code_with_ai(content_str, file_type, analysis_type)
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Create result object
        result = AnalysisResult(
            user_id=current_user.uid if current_user else "anonymous",
            file_name=file.filename,
            file_type=file_type,
            analysis_type=analysis_type,
            issues=analysis_result.get("issues", []),
            suggestions=analysis_result.get("suggestions", []),
            security_score=analysis_result.get("security_score", 0),
            code_quality_score=analysis_result.get("code_quality_score", 0),
            summary=analysis_result.get("summary", "Analysis completed"),
            ai_model_used=analysis_result.get("ai_model_used", "claude-3-5-sonnet-20241022"),
            processing_time=processing_time
        )
        
        # Save to database
        await db.analysis_results.insert_one(result.dict())
        
        # Save to history
        if current_user:
            history = AnalysisHistory(
                user_id=current_user.uid,
                file_name=file.filename,
                file_type=file_type,
                analysis_type=analysis_type,
                result_id=result.id,
                status="completed"
            )
            await db.analysis_history.insert_one(history.dict())
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@api_router.post("/analyze/text", response_model=AnalysisResult)
async def analyze_text_code(
    request: dict,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """Analyze code from text input"""
    try:
        # Check user limits if authenticated
        if current_user:
            user = await subscription_service.get_user(current_user.uid)
            if user:
                # Check if user can perform analysis
                can_analyze = await subscription_service.record_analysis(user)
                if not can_analyze:
                    usage_info = await subscription_service.check_usage_limit(user)
                    raise HTTPException(
                        status_code=402, 
                        detail={
                            "error": "Usage limit exceeded",
                            "remaining": usage_info["remaining"],
                            "limit": usage_info["limit"],
                            "tier": usage_info["tier"]
                        }
                    )
        
        # Extract request data
        file_content = request.get("file_content", "")
        file_type = request.get("file_type", "")
        analysis_type = request.get("analysis_type", "comprehensive")
        
        if not file_content or not file_type:
            raise HTTPException(status_code=400, detail="Missing file_content or file_type")
        
        # Analyze with AI
        start_time = datetime.utcnow()
        analysis_result = await analyze_code_with_ai(file_content, file_type, analysis_type)
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Create result object
        result = AnalysisResult(
            user_id=current_user.uid if current_user else "anonymous",
            file_name="text_input",
            file_type=file_type,
            analysis_type=analysis_type,
            issues=analysis_result.get("issues", []),
            suggestions=analysis_result.get("suggestions", []),
            security_score=analysis_result.get("security_score", 0),
            code_quality_score=analysis_result.get("code_quality_score", 0),
            summary=analysis_result.get("summary", "Analysis completed"),
            ai_model_used=analysis_result.get("ai_model_used", "claude-3-5-sonnet-20241022"),
            processing_time=processing_time
        )
        
        # Save to database
        await db.analysis_results.insert_one(result.dict())
        
        # Save to history
        if current_user:
            history = AnalysisHistory(
                user_id=current_user.uid,
                file_name="text_input",
                file_type=file_type,
                analysis_type=analysis_type,
                result_id=result.id,
                status="completed"
            )
            await db.analysis_history.insert_one(history.dict())
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Text analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@api_router.get("/analysis/history", response_model=List[AnalysisHistory])
async def get_analysis_history(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Get analysis history for current user"""
    try:
        history = await db.analysis_history.find(
            {"user_id": current_user.uid}
        ).sort("timestamp", -1).to_list(100)
        return [AnalysisHistory(**item) for item in history]
    except Exception as e:
        logger.error(f"History retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")

@api_router.get("/analysis/result/{result_id}", response_model=AnalysisResult)
async def get_analysis_result(
    result_id: str,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """Get specific analysis result"""
    try:
        # Build query - if user is authenticated, only show their results
        query = {"id": result_id}
        if current_user:
            query["user_id"] = current_user.uid
        
        result = await db.analysis_results.find_one(query)
        if not result:
            raise HTTPException(status_code=404, detail="Analysis result not found")
        return AnalysisResult(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Result retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve result: {str(e)}")

# ============================================================================
# ADMIN ROUTES
# ============================================================================

@api_router.get("/admin/stats", response_model=AdminStats)
async def get_admin_stats(admin_user: AuthenticatedUser = Depends(get_admin_user)):
    """Get admin dashboard statistics"""
    try:
        stats = await subscription_service.get_subscription_stats()
        
        # Get additional stats
        total_analyses = await db.analysis_results.count_documents({})
        
        # Analyses this month
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        analyses_this_month = await db.analysis_results.count_documents({
            "timestamp": {"$gte": start_of_month}
        })
        
        return AdminStats(
            total_users=stats["total_users"],
            active_subscriptions=stats["active_subscriptions"],
            monthly_revenue=stats["monthly_revenue"],
            total_analyses=total_analyses,
            analyses_this_month=analyses_this_month,
            conversion_rate=stats["conversion_rate"]
        )
        
    except Exception as e:
        logger.error(f"Admin stats error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve admin stats")

@api_router.get("/admin/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    admin_user: AuthenticatedUser = Depends(get_admin_user)
):
    """Get all users for admin"""
    try:
        users = await db.users.find({}).skip(skip).limit(limit).to_list(limit)
        return {"users": users}
    except Exception as e:
        logger.error(f"Admin users error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve users")

# ============================================================================
# SUPPORT ROUTES
# ============================================================================

@api_router.post("/support/ticket", response_model=SupportTicket)
async def create_support_ticket(
    ticket_data: dict,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """Create support ticket"""
    try:
        ticket = SupportTicket(
            user_id=current_user.uid if current_user else "anonymous",
            email=ticket_data.get("email", current_user.email if current_user else ""),
            subject=ticket_data.get("subject", ""),
            message=ticket_data.get("message", ""),
            priority=ticket_data.get("priority", "normal")
        )
        
        await db.support_tickets.insert_one(ticket.dict())
        return ticket
        
    except Exception as e:
        logger.error(f"Support ticket error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create support ticket")

# ============================================================================
# PUBLIC ROUTES
# ============================================================================

@api_router.get("/")
async def root():
    return {"message": "AI Bug Hunter & Code Analyzer SaaS API", "version": "2.0.0", "status": "running"}

@api_router.get("/supported-languages")
async def get_supported_languages():
    """Get list of supported programming languages"""
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
            {"name": "Rust", "extension": ".rs", "type": "rust"},
            {"name": "Kotlin", "extension": ".kt", "type": "kotlin"},
            {"name": "Swift", "extension": ".swift", "type": "swift"},
            {"name": "HTML", "extension": ".html", "type": "html"},
            {"name": "CSS", "extension": ".css", "type": "css"},
            {"name": "SQL", "extension": ".sql", "type": "sql"},
            {"name": "JSON", "extension": ".json", "type": "json"},
            {"name": "YAML", "extension": ".yaml", "type": "yaml"}
        ]
    }

@api_router.get("/analysis-types")
async def get_analysis_types():
    """Get available analysis types"""
    return {
        "types": [
            {"id": "comprehensive", "name": "Comprehensive Analysis", "description": "Complete code analysis including bugs, security, performance, and style"},
            {"id": "security", "name": "Security Analysis", "description": "Focus on security vulnerabilities and threats"},
            {"id": "bugs", "name": "Bug Detection", "description": "Find functional bugs and logic errors"},
            {"id": "performance", "name": "Performance Analysis", "description": "Identify performance bottlenecks and optimization opportunities"},
            {"id": "style", "name": "Code Style", "description": "Check coding standards and maintainability"}
        ]
    }

# Include the router in the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)