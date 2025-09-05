"""
Sentry Configuration for FastAPI Backend
Enhanced error monitoring, performance tracking, and contextual logging
"""

import os
import logging
from typing import Dict, Any, Optional
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.httpx import HttpxIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.asyncio import AsyncioIntegration
from sentry_sdk import configure_scope

# Configure logging integration
logging_integration = LoggingIntegration(
    level=logging.INFO,        # Capture info and above as breadcrumbs
    event_level=logging.ERROR  # Send errors as events
)

def init_sentry() -> None:
    """
    Initialize Sentry SDK with comprehensive FastAPI monitoring
    """
    # Environment variables
    sentry_dsn = os.getenv("SENTRY_DSN")
    environment = os.getenv("ENVIRONMENT", "development")
    debug_mode = os.getenv("DEBUG", "false").lower() == "true"
    app_version = os.getenv("APP_VERSION", "1.0.0")
    
    # Only initialize if DSN is provided
    if not sentry_dsn:
        print("⚠️  Sentry DSN not configured - error monitoring disabled")
        return
    
    # Calculate sample rates based on environment
    traces_sample_rate = 1.0 if environment == "development" else 0.1
    profiles_sample_rate = 1.0 if environment == "development" else 0.1
    
    print(f"🔧 Initializing Sentry for environment: {environment}")
    
    sentry_sdk.init(
        dsn=sentry_dsn,
        debug=debug_mode,
        
        # Performance monitoring
        traces_sample_rate=traces_sample_rate,
        profiles_sample_rate=profiles_sample_rate,
        
        # Environment and release tracking
        environment=environment,
        release=app_version,
        
        # Enhanced integrations for FastAPI backend
        integrations=[
            # FastAPI integration with transaction tracking
            FastApiIntegration(
                auto_enable=True,
                transaction_style="endpoint",  # Track by endpoint name
                failed_request_status_codes=[400, 401, 403, 404, 413, 429, 500, 502, 503, 504]
            ),
            
            # Database monitoring
            SqlalchemyIntegration(),
            
            # HTTP client monitoring (for OpenAI, Supabase calls)
            HttpxIntegration(),
            
            # Async operation monitoring
            AsyncioIntegration(),
            
            # Logging integration
            logging_integration,
        ],
        
        # Intelligent error filtering
        before_send=_filter_events,
        
        # Performance transaction filtering
        before_send_transaction=_enhance_transactions,
        
        # Initial context and tags
        **_get_initial_scope_config()
    )
    
    # Set up global context
    with configure_scope() as scope:
        scope.set_tag("component", "fastapi-backend")
        scope.set_tag("runtime", "python")
        scope.set_tag("platform", "fastapi")
        scope.set_context("app", {
            "name": "AI Course Platform Backend",
            "version": app_version,
            "environment": environment,
        })
    
    print("✅ Sentry initialized successfully for FastAPI backend")


def _filter_events(event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Intelligent event filtering to reduce noise and focus on actionable errors
    """
    # Enhanced logging in development
    if os.getenv("DEBUG", "false").lower() == "true":
        print("🔍 Sentry Backend Event:")
        print(f"  Exception: {hint.get('exc_info', 'No exception')}")
        print(f"  Level: {event.get('level', 'unknown')}")
        print(f"  Tags: {event.get('tags', {})}")
    
    # Filter based on exception type
    if "exc_info" in hint:
        exc_type, exc_value, _ = hint["exc_info"]
        
        if exc_value:
            error_message = str(exc_value)
            
            # Filter expected API errors (client errors, not system issues)
            expected_patterns = [
                "401",  # Unauthorized
                "403",  # Forbidden  
                "404",  # Not found
                "422",  # Validation error
                "JWT",  # JWT token issues
                "Invalid token",
                "Token expired",
                "User not found",
                "Invalid credentials"
            ]
            
            if any(pattern in error_message for pattern in expected_patterns):
                # Still log for monitoring but don't spam Sentry
                logging.info(f"⚠️ Expected API error: {error_message}")
                return None
            
            # Filter database connection retries (expected during scaling)
            if "connection" in error_message.lower() and any(
                keyword in error_message.lower() 
                for keyword in ["retry", "timeout", "pool", "acquire"]
            ):
                logging.warning(f"⚠️ Database connection issue (retry expected): {error_message}")
                return None
            
            # Filter OpenAI rate limits (expected behavior)
            if any(pattern in error_message for pattern in [
                "rate limit",
                "quota exceeded", 
                "model overloaded",
                "timeout",
                "Request timeout"
            ]):
                logging.warning(f"⚠️ Expected OpenAI service issue: {error_message}")
                return None
    
    # Enhance events with backend context
    event.setdefault("contexts", {})
    event["contexts"]["backend"] = {
        "component": "fastapi",
        "runtime": "python",
        "features": ["openai", "supabase", "sqlalchemy", "jwt"],
    }
    
    # Filter sensitive data from request context
    if "request" in event:
        _sanitize_request_data(event["request"])
    
    return event


def _enhance_transactions(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Enhance transaction events with API-specific context
    """
    transaction_name = event.get("transaction", "")
    
    # Add feature-specific tags
    if "/auth" in transaction_name:
        event.setdefault("tags", {})["feature"] = "authentication"
        event["tags"]["service"] = "jwt"
    
    elif "/courses" in transaction_name:
        event.setdefault("tags", {})["feature"] = "course_management"
        event["tags"]["service"] = "ai_content"
    
    elif "/clients" in transaction_name:
        event.setdefault("tags", {})["feature"] = "client_management"
        event["tags"]["service"] = "database"
    
    # Add performance context for slow operations
    if event.get("timestamp") and event.get("start_timestamp"):
        duration = event["timestamp"] - event["start_timestamp"]
        if duration > 5.0:  # Operations longer than 5 seconds
            event.setdefault("tags", {})["performance"] = "slow"
    
    return event


def _sanitize_request_data(request_data: Dict[str, Any]) -> None:
    """
    Remove sensitive information from request data
    """
    sensitive_headers = [
        "authorization", "cookie", "x-api-key", "x-auth-token",
        "jwt", "bearer", "password", "secret"
    ]
    
    # Sanitize headers
    if "headers" in request_data:
        for header in sensitive_headers:
            if header in request_data["headers"]:
                request_data["headers"][header] = "[Filtered]"
    
    # Sanitize query parameters
    if "query_string" in request_data:
        sensitive_params = ["password", "token", "secret", "key", "jwt"]
        for param in sensitive_params:
            if param in str(request_data["query_string"]).lower():
                request_data["query_string"] = "[Filtered - contains sensitive data]"
                break


def _get_initial_scope_config() -> Dict[str, Any]:
    """
    Get initial scope configuration for Sentry
    """
    return {
        "tags": {
            "component": "ai-course-platform-backend",
            "runtime": "python",
            "platform": "fastapi",
            "version": os.getenv("APP_VERSION", "1.0.0"),
        }
    }


def capture_api_error(
    error: Exception, 
    endpoint: str, 
    user_id: Optional[str] = None,
    additional_context: Optional[Dict[str, Any]] = None
) -> None:
    """
    Capture API-specific errors with enhanced context
    
    Args:
        error: The exception that occurred
        endpoint: The API endpoint where the error occurred
        user_id: Optional user ID for context
        additional_context: Additional context information
    """
    with configure_scope() as scope:
        # Set endpoint context
        scope.set_tag("api_endpoint", endpoint)
        
        # Set user context if available
        if user_id:
            scope.set_user({"id": user_id})
        
        # Add additional context
        if additional_context:
            scope.set_context("api_context", additional_context)
        
        # Capture the exception
        sentry_sdk.capture_exception(error)


def capture_performance_metric(
    operation: str,
    duration: float,
    additional_tags: Optional[Dict[str, str]] = None
) -> None:
    """
    Capture performance metrics for monitoring
    
    Args:
        operation: Name of the operation
        duration: Duration in seconds
        additional_tags: Additional tags for the metric
    """
    with configure_scope() as scope:
        scope.set_tag("operation", operation)
        
        if additional_tags:
            for key, value in additional_tags.items():
                scope.set_tag(key, value)
        
        # Create a custom transaction for the performance metric
        sentry_sdk.set_measurement(f"{operation}_duration", duration, "second")