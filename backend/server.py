from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import tempfile
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="AI Bug Hunter & Code Analyzer", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pydantic Models
class AnalysisRequest(BaseModel):
    file_content: str
    file_type: str
    analysis_type: str = "comprehensive"  # comprehensive, security, bugs, performance, style

class GitHubAnalysisRequest(BaseModel):
    github_url: str
    branch: str = "main"
    analysis_type: str = "comprehensive"

class AnalysisResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    file_type: str
    analysis_type: str
    issues: List[Dict[str, Any]]
    suggestions: List[Dict[str, Any]]
    security_score: int
    code_quality_score: int
    summary: str
    ai_model_used: str

class AnalysisHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    file_name: str
    file_type: str
    analysis_type: str
    result_id: str
    status: str

# AI Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')

# Analysis Templates
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
        ).with_model("anthropic", "claude-3-5-sonnet-20240620")
        
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
            result["ai_model_used"] = "claude-3-5-sonnet-20240620"
            return result
        except json.JSONDecodeError:
            # Fallback if response isn't valid JSON
            return {
                "issues": [{"type": "analysis", "severity": "info", "line": 0, "description": "AI analysis completed", "suggestion": response[:500]}],
                "suggestions": [],
                "security_score": 75,
                "code_quality_score": 80,
                "summary": response[:200] + "..." if len(response) > 200 else response,
                "ai_model_used": "claude-3-5-sonnet-20240620"
            }
            
    except Exception as e:
        logger.error(f"AI analysis error: {str(e)}")
        return {
            "issues": [{"type": "error", "severity": "high", "line": 0, "description": f"Analysis failed: {str(e)}", "suggestion": "Please try again or contact support"}],
            "suggestions": [],
            "security_score": 0,
            "code_quality_score": 0,
            "summary": f"Analysis failed due to: {str(e)}",
            "ai_model_used": "claude-3-5-sonnet-20240620"
        }

# API Routes
@api_router.get("/")
async def root():
    return {"message": "AI Bug Hunter & Code Analyzer API", "version": "1.0.0", "status": "running"}

@api_router.post("/analyze/upload", response_model=AnalysisResult)
async def analyze_uploaded_file(
    file: UploadFile = File(...),
    analysis_type: str = Form(default="comprehensive")
):
    """Analyze uploaded code file"""
    try:
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
        analysis_result = await analyze_code_with_ai(content_str, file_type, analysis_type)
        
        # Create result object
        result = AnalysisResult(
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
        
        # Save to history
        history = AnalysisHistory(
            file_name=file.filename,
            file_type=file_type,
            analysis_type=analysis_type,
            result_id=result.id,
            status="completed"
        )
        await db.analysis_history.insert_one(history.dict())
        
        return result
        
    except Exception as e:
        logger.error(f"File analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@api_router.post("/analyze/text", response_model=AnalysisResult)
async def analyze_text_code(request: AnalysisRequest):
    """Analyze code from text input"""
    try:
        # Analyze with AI
        analysis_result = await analyze_code_with_ai(request.file_content, request.file_type, request.analysis_type)
        
        # Create result object
        result = AnalysisResult(
            file_type=request.file_type,
            analysis_type=request.analysis_type,
            issues=analysis_result.get("issues", []),
            suggestions=analysis_result.get("suggestions", []),
            security_score=analysis_result.get("security_score", 0),
            code_quality_score=analysis_result.get("code_quality_score", 0),
            summary=analysis_result.get("summary", "Analysis completed"),
            ai_model_used=analysis_result.get("ai_model_used", "claude-3-5-sonnet-20241022")
        )
        
        # Save to database
        await db.analysis_results.insert_one(result.dict())
        
        # Save to history
        history = AnalysisHistory(
            file_name="text_input",
            file_type=request.file_type,
            analysis_type=request.analysis_type,
            result_id=result.id,
            status="completed"
        )
        await db.analysis_history.insert_one(history.dict())
        
        return result
        
    except Exception as e:
        logger.error(f"Text analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@api_router.get("/analysis/history", response_model=List[AnalysisHistory])
async def get_analysis_history():
    """Get analysis history"""
    try:
        history = await db.analysis_history.find().sort("timestamp", -1).to_list(100)
        return [AnalysisHistory(**item) for item in history]
    except Exception as e:
        logger.error(f"History retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")

@api_router.get("/analysis/result/{result_id}", response_model=AnalysisResult)
async def get_analysis_result(result_id: str):
    """Get specific analysis result"""
    try:
        result = await db.analysis_results.find_one({"id": result_id})
        if not result:
            raise HTTPException(status_code=404, detail="Analysis result not found")
        return AnalysisResult(**result)
    except Exception as e:
        logger.error(f"Result retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve result: {str(e)}")

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