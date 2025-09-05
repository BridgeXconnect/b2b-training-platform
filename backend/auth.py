"""
Authentication and JWT handling with comprehensive Sentry monitoring
"""

import os
import jwt
import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy import select
import sentry_sdk
from config.sentry_config import SentryConfig
from models import User, UserResponse
from database import get_db

logger = logging.getLogger(__name__)

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "2ccb5692-7a5c-4497-b14c-b57989cd0ebb")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verify and decode a JWT token with Sentry monitoring"""
    try:
        with sentry_sdk.start_span(op="auth", description="verify_token") as span:
            span.set_tag("operation", "token_verification")
            
            # Add breadcrumb for token verification
            sentry_sdk.add_breadcrumb(
                message="Verifying JWT token",
                category="authentication",
                level="debug"
            )
            
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            
            if email is None:
                sentry_sdk.add_breadcrumb(
                    message="Token verification failed - no subject",
                    category="authentication",
                    level="warning"
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Add success breadcrumb
            sentry_sdk.add_breadcrumb(
                message=f"Token verified successfully for {email}",
                category="authentication",
                level="debug",
                data={"email": email}
            )
            
            return email
            
    except jwt.ExpiredSignatureError as e:
        sentry_sdk.add_breadcrumb(
            message="Token verification failed - expired",
            category="authentication",
            level="warning"
        )
        logger.warning("JWT token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        sentry_sdk.add_breadcrumb(
            message="Token verification failed - invalid token",
            category="authentication",
            level="warning"
        )
        logger.warning(f"Invalid JWT token: {str(e)}")
        SentryConfig.capture_auth_error(e, endpoint="verify_token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {str(e)}")
        SentryConfig.capture_auth_error(e, endpoint="verify_token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> UserResponse:
    """Get the current authenticated user with Sentry monitoring"""
    
    with sentry_sdk.start_span(op="auth", description="get_current_user") as span:
        try:
            span.set_tag("operation", "get_current_user")
            
            token = credentials.credentials
            email = verify_token(token)
            
            # Add breadcrumb for user lookup
            sentry_sdk.add_breadcrumb(
                message=f"Looking up user: {email}",
                category="authentication",
                level="debug",
                data={"email": email}
            )
            
            # Query user from database
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            
            if user is None:
                sentry_sdk.add_breadcrumb(
                    message=f"User not found in database: {email}",
                    category="authentication",
                    level="warning",
                    data={"email": email}
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            if not user.is_active:
                sentry_sdk.add_breadcrumb(
                    message=f"Inactive user attempted access: {email}",
                    category="authentication",
                    level="warning",
                    data={"email": email, "user_id": user.id}
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Inactive user"
                )
            
            # Set user context for future Sentry events
            sentry_sdk.set_user({
                "id": user.id,
                "email": user.email,
                "role": user.role.value if hasattr(user.role, 'value') else str(user.role)
            })
            
            # Add success breadcrumb
            sentry_sdk.add_breadcrumb(
                message=f"User authenticated successfully: {email}",
                category="authentication",
                level="debug",
                data={"user_id": user.id, "role": str(user.role)}
            )
            
            return UserResponse.from_orm(user)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting current user: {str(e)}")
            SentryConfig.capture_auth_error(e, endpoint="get_current_user")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication error"
            )

async def authenticate_user(db: Session, email: str, password: str):
    """Authenticate a user with email and password"""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def verify_refresh_token(token: str) -> Optional[str]:
    """Verify a refresh token and return email if valid"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        return email
    except jwt.PyJWTError:
        return None

async def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()