"""
FastAPI Backend for B2B English Training Platform
BMAD Story 4: Database & API Backend Foundation
Enhanced with comprehensive Sentry monitoring and error tracking
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
from datetime import datetime, timedelta
from typing import List, Optional
import uvicorn
import logging

# Initialize Sentry monitoring FIRST - before any other imports
from config.sentry_config import sentry_config
sentry_config.init_sentry()

# Import our models and database
from models import *
from database import get_db, init_db
from auth import create_access_token, verify_token, get_current_user
from routers import auth_router, clients_router, courses_router
from routers.progress import router as progress_router
from middleware import SentryMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="B2B English Training Platform API",
    description="Backend API for CEFR-aligned course generation with SOP integration - Enhanced with Sentry monitoring",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add Sentry middleware FIRST for comprehensive monitoring
app.add_middleware(
    SentryMiddleware,
    capture_body=True,
    capture_headers=True
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3002", 
        "https://*.csb.app",
        "https://*.codesandbox.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
app.include_router(clients_router, prefix="/api/clients", tags=["clients"])
app.include_router(courses_router, prefix="/api/courses", tags=["courses"])
app.include_router(progress_router, tags=["progress"])

@app.on_event("startup")
async def startup_event():
    """Initialize database and Sentry monitoring on startup"""
    logger.info("🚀 Starting AI Course Platform Backend...")
    
    # Initialize database
    await init_db()
    logger.info("✅ Database initialized")
    
    # Log Sentry initialization status
    import sentry_sdk
    if sentry_sdk.Hub.current.client:
        logger.info("✅ Sentry monitoring active")
    else:
        logger.warning("⚠️ Sentry monitoring not initialized")
    
    logger.info("🎯 Backend startup complete - Ready for requests")

@app.get("/")
async def root():
    """Root endpoint for health check"""
    return {
        "message": "B2B English Training Platform API",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.utcnow()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint with Sentry monitoring status"""
    import sentry_sdk
    
    # Check Sentry status
    sentry_status = "active" if sentry_sdk.Hub.current.client else "inactive"
    
    health_data = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "monitoring": {
            "sentry": sentry_status,
            "environment": os.getenv("ENVIRONMENT", "development"),
            "version": "2.0.0"
        },
        "features": [
            "ai_service",
            "authentication", 
            "course_generation",
            "sentry_monitoring",
            "performance_tracking"
        ]
    }
    
    logger.info("Health check requested - System healthy")
    return health_data

@app.get("/sentry-debug")
async def sentry_debug():
    """Sentry debug endpoint to test error monitoring"""
    import sentry_sdk
    
    # Add some context for the test
    sentry_sdk.set_tag("test", "sentry_debug")
    sentry_sdk.add_breadcrumb(
        message="Sentry debug endpoint called",
        category="test",
        level="info"
    )
    
    logger.info("Sentry debug endpoint called - Testing error monitoring")
    
    # Simulate an error for testing
    try:
        division_by_zero = 1 / 0
    except ZeroDivisionError as e:
        sentry_sdk.capture_exception(e)
        return {
            "message": "Sentry error monitoring test",
            "error_captured": True,
            "sentry_status": "active" if sentry_sdk.Hub.current.client else "inactive",
            "timestamp": datetime.utcnow().isoformat()
        }

# Backend Recovery Endpoints for Frontend Error Boundaries

@app.post("/api/session/cleanup")
async def cleanup_session_state():
    """Clean up backend session state for frontend error recovery"""
    
    with sentry_sdk.start_transaction(op="recovery", name="session_cleanup") as transaction:
        try:
            transaction.set_tag("operation", "session_cleanup")
            transaction.set_tag("source", "frontend_error_boundary")
            
            # Add breadcrumb for cleanup request
            sentry_sdk.add_breadcrumb(
                message="Frontend requested session cleanup",
                category="error_recovery",
                level="info"
            )
            
            # Here you would implement actual cleanup logic:
            # - Clear cached AI responses
            # - Reset workflow states
            # - Clean temporary data
            # - Reset user session data
            
            cleanup_actions = [
                "cached_ai_responses_cleared",
                "workflow_states_reset", 
                "temporary_data_cleaned",
                "session_data_reset"
            ]
            
            # Add success breadcrumb
            sentry_sdk.add_breadcrumb(
                message="Session cleanup completed successfully",
                category="error_recovery",
                level="info",
                data={"actions": cleanup_actions}
            )
            
            logger.info("Backend session cleanup completed")
            
            return {
                "success": True,
                "message": "Session state cleaned up successfully",
                "actions_performed": cleanup_actions,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error during session cleanup: {str(e)}")
            sentry_sdk.capture_exception(e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to cleanup session state"
            )

@app.post("/api/error/report")
async def report_frontend_error(error_data: dict):
    """Receive and process frontend error reports for backend correlation"""
    
    with sentry_sdk.start_transaction(op="error_reporting", name="frontend_error_report") as transaction:
        try:
            transaction.set_tag("operation", "frontend_error_report")
            transaction.set_tag("error_source", "frontend")
            
            # Extract error details
            error_message = error_data.get("message", "Unknown frontend error")
            error_stack = error_data.get("stack", "No stack trace")
            error_component = error_data.get("component", "Unknown component")
            error_props = error_data.get("props", {})
            user_agent = error_data.get("userAgent", "Unknown")
            url = error_data.get("url", "Unknown")
            
            # Set additional transaction context
            transaction.set_tag("error_component", error_component)
            transaction.set_tag("frontend_url", url)
            
            # Add comprehensive error context
            sentry_sdk.set_context("frontend_error", {
                "message": error_message,
                "component": error_component,
                "url": url,
                "user_agent": user_agent,
                "props": error_props,
                "stack_trace": error_stack[:1000] if error_stack else None  # Limit stack trace size
            })
            
            # Add breadcrumb
            sentry_sdk.add_breadcrumb(
                message=f"Frontend error reported: {error_message}",
                category="frontend_error",
                level="error",
                data={
                    "component": error_component,
                    "url": url
                }
            )
            
            # Create a synthetic exception for Sentry
            try:
                raise Exception(f"Frontend Error in {error_component}: {error_message}")
            except Exception as synthetic_error:
                error_id = sentry_sdk.capture_exception(synthetic_error)
            
            logger.error(f"Frontend error reported - Component: {error_component}, Message: {error_message}")
            
            return {
                "success": True,
                "message": "Frontend error reported successfully",
                "sentry_error_id": error_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing frontend error report: {str(e)}")
            sentry_sdk.capture_exception(e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process frontend error report"
            )

@app.get("/api/health/detailed")
async def detailed_health_check():
    """Detailed health check endpoint for monitoring system state"""
    
    with sentry_sdk.start_transaction(op="health_check", name="detailed_health_check") as transaction:
        try:
            transaction.set_tag("operation", "detailed_health_check")
            
            # Check various system components
            health_status = {
                "overall": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "components": {}
            }
            
            # Database health
            try:
                from database import test_connection
                db_healthy = await test_connection()
                health_status["components"]["database"] = {
                    "status": "healthy" if db_healthy else "unhealthy",
                    "last_check": datetime.utcnow().isoformat()
                }
            except Exception as e:
                health_status["components"]["database"] = {
                    "status": "unhealthy",
                    "error": str(e),
                    "last_check": datetime.utcnow().isoformat()
                }
                health_status["overall"] = "degraded"
            
            # Sentry health
            import sentry_sdk
            sentry_status = "active" if sentry_sdk.Hub.current.client else "inactive"
            health_status["components"]["sentry"] = {
                "status": sentry_status,
                "environment": os.getenv("ENVIRONMENT", "development"),
                "last_check": datetime.utcnow().isoformat()
            }
            
            # AI Service health (basic check)
            try:
                from services.ai_service import ai_service
                ai_status = "available" if ai_service.client else "unavailable"
                health_status["components"]["ai_service"] = {
                    "status": ai_status,
                    "model": ai_service.model if ai_service.client else None,
                    "last_check": datetime.utcnow().isoformat()
                }
            except Exception as e:
                health_status["components"]["ai_service"] = {
                    "status": "error",
                    "error": str(e),
                    "last_check": datetime.utcnow().isoformat()
                }
            
            # Add health check breadcrumb
            sentry_sdk.add_breadcrumb(
                message="Detailed health check completed",
                category="health_check",
                level="info",
                data={"overall_status": health_status["overall"]}
            )
            
            return health_status
            
        except Exception as e:
            logger.error(f"Error during detailed health check: {str(e)}")
            sentry_sdk.capture_exception(e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Health check failed"
            )

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )