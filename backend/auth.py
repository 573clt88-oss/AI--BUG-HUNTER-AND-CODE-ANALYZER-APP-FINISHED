# Firebase Authentication Integration
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import os
import json

# Initialize Firebase Admin (only once)
def initialize_firebase():
    if not firebase_admin._apps:
        # For development - use environment variable for credentials
        firebase_config = os.environ.get('FIREBASE_CONFIG')
        if firebase_config:
            # Parse JSON credentials from environment
            cred_dict = json.loads(firebase_config)
            cred = credentials.Certificate(cred_dict)
        else:
            # Fallback to service account file
            cred_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT_PATH', 'firebase-admin.json')
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
            else:
                # For demo/development without Firebase setup
                return None
        
        firebase_admin.initialize_app(cred)
    return firebase_admin.get_app()

# Initialize Firebase on module import
firebase_app = initialize_firebase()

# Security scheme
security = HTTPBearer()

class AuthenticatedUser:
    def __init__(self, uid: str, email: str, name: Optional[str] = None):
        self.uid = uid
        self.email = email
        self.name = name
        self.is_admin = False  # Will be set based on database lookup

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> AuthenticatedUser:
    """
    Verify Firebase token and return user info
    """
    try:
        if not firebase_app:
            # For development without Firebase - create mock user
            return AuthenticatedUser(
                uid="demo_user",
                email="demo@example.com", 
                name="Demo User"
            )
            
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(credentials.credentials)
        
        return AuthenticatedUser(
            uid=decoded_token['uid'],
            email=decoded_token.get('email', ''),
            name=decoded_token.get('name')
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_admin_user(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    """
    Require admin permissions
    """
    # In a real implementation, check database for admin status
    # For now, check if user email is in admin list
    admin_emails = os.environ.get('ADMIN_EMAILS', '').split(',')
    
    if current_user.email not in admin_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    current_user.is_admin = True
    return current_user

# Optional auth dependency (for endpoints that work with or without auth)
async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[AuthenticatedUser]:
    """
    Get user if authenticated, None otherwise
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None