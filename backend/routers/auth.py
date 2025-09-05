"""
Authentication router with comprehensive Sentry monitoring
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import timedelta
import uuid
import logging
import sentry_sdk
from config.sentry_config import SentryConfig

from models import User, UserCreate, UserLogin, UserResponse, Token, UserRole
from database import get_db
from auth import (
    authenticate_user, 
    create_access_token, 
    create_refresh_token,
    get_password_hash,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user with Sentry monitoring"""
    
    with sentry_sdk.start_transaction(op="auth", name="register_user") as transaction:
        try:
            # Set transaction context
            transaction.set_tag("email", user.email)
            transaction.set_tag("role", user.role.value)
            transaction.set_tag("operation", "register")
            
            # Add breadcrumb for registration attempt
            sentry_sdk.add_breadcrumb(
                message=f"User registration attempt for {user.email}",
                category="authentication",
                level="info",
                data={"email": user.email, "role": user.role.value}
            )
            
            # Check if user already exists
            result = await db.execute(select(User).where(User.email == user.email))
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                # Log attempted duplicate registration
                sentry_sdk.add_breadcrumb(
                    message=f"Registration failed - email already exists: {user.email}",
                    category="authentication",
                    level="warning"
                )
                
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            # Create new user
            hashed_password = get_password_hash(user.password)
            user_id = str(uuid.uuid4())
            
            db_user = User(
                id=user_id,
                email=user.email,
                hashed_password=hashed_password,
                name=user.name,
                role=user.role,
                company_id=user.company_id,
                is_active=True
            )
            
            db.add(db_user)
            await db.commit()
            await db.refresh(db_user)
            
            # Add success breadcrumb
            sentry_sdk.add_breadcrumb(
                message=f"User registered successfully: {user.email}",
                category="authentication",
                level="info",
                data={"user_id": user_id, "role": user.role.value}
            )
            
            # Set user context for future events
            sentry_sdk.set_user({"id": user_id, "email": user.email})
            
            logger.info(f"User registered successfully: {user.email}")
            return UserResponse.from_orm(db_user)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Registration error for {user.email}: {str(e)}")
            SentryConfig.capture_auth_error(e, endpoint="register")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration failed"
            )

@router.post("/login", response_model=Token)
async def login_user(user: UserLogin, db: Session = Depends(get_db)):
    """Login user and return JWT tokens with Sentry monitoring"""
    
    with sentry_sdk.start_transaction(op="auth", name="login_user") as transaction:
        try:
            # Set transaction context
            transaction.set_tag("email", user.email)
            transaction.set_tag("operation", "login")
            
            # Add breadcrumb for login attempt
            sentry_sdk.add_breadcrumb(
                message=f"Login attempt for {user.email}",
                category="authentication", 
                level="info",
                data={"email": user.email}
            )
            
            # Authenticate user
            authenticated_user = await authenticate_user(db, user.email, user.password)
            if not authenticated_user:
                # Log failed authentication
                sentry_sdk.add_breadcrumb(
                    message=f"Authentication failed for {user.email}",
                    category="authentication",
                    level="warning",
                    data={"email": user.email, "reason": "invalid_credentials"}
                )
                
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Create tokens
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": authenticated_user.email}, 
                expires_delta=access_token_expires
            )
            refresh_token = create_refresh_token(data={"sub": authenticated_user.email})
            
            # Add success breadcrumb
            sentry_sdk.add_breadcrumb(
                message=f"User logged in successfully: {user.email}",
                category="authentication",
                level="info",
                data={"user_id": authenticated_user.id, "email": user.email}
            )
            
            # Set user context for future events
            sentry_sdk.set_user({
                "id": authenticated_user.id, 
                "email": authenticated_user.email,
                "role": authenticated_user.role.value
            })
            
            logger.info(f"User logged in successfully: {user.email}")
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Login error for {user.email}: {str(e)}")
            SentryConfig.capture_auth_error(e, endpoint="login")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Login failed"
            )

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """OAuth2 compatible token endpoint"""
    
    authenticated_user = await authenticate_user(db, form_data.username, form_data.password)
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": authenticated_user.email}, 
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": authenticated_user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserResponse = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@router.post("/refresh", response_model=Token)
async def refresh_token(
    request: dict,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    try:
        # Verify refresh token
        from auth import verify_refresh_token, get_user_by_email
        
        refresh_token = request.get("refresh_token")
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token is required"
            )
        
        email = verify_refresh_token(refresh_token)
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Get user
        user = await get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Create new tokens
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, 
            expires_delta=access_token_expires
        )
        new_refresh_token = create_refresh_token(data={"sub": user.email})
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": UserResponse.from_orm(user)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

# Import and assign the router
auth_router = router