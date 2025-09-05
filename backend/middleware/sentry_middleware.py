"""
Custom Sentry Middleware for FastAPI Backend
Enhanced request/response monitoring and error capture with AI service context
"""

import time
import json
from typing import Callable, Dict, Any, Optional
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import sentry_sdk
from sentry_sdk import set_context, set_tag, add_breadcrumb
import logging

logger = logging.getLogger(__name__)

class SentryMiddleware(BaseHTTPMiddleware):
    """
    Custom Sentry middleware for comprehensive FastAPI request/response monitoring
    Provides enhanced context for AI Course Platform backend services
    """
    
    def __init__(self, app, capture_body: bool = True, capture_headers: bool = True):
        super().__init__(app)
        self.capture_body = capture_body
        self.capture_headers = capture_headers
        self.sensitive_headers = {
            'authorization', 'x-api-key', 'cookie', 'x-supabase-auth',
            'x-rpc-authorization', 'apikey'
        }
        self.sensitive_body_keys = {
            'password', 'token', 'api_key', 'secret', 'refresh_token',
            'access_token', 'auth_token'
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with comprehensive Sentry monitoring and distributed tracing"""
        
        # Start timing
        start_time = time.time()
        
        # Extract distributed tracing headers from frontend
        sentry_trace = request.headers.get("sentry-trace")
        baggage = request.headers.get("baggage")
        
        # Set up distributed tracing context if available
        transaction_context = {}
        if sentry_trace:
            # Parse sentry-trace header: trace_id-span_id-sampled
            try:
                parts = sentry_trace.split("-")
                if len(parts) >= 2:
                    transaction_context.update({
                        "parent_trace_id": parts[0],
                        "parent_span_id": parts[1],
                        "sampled": parts[2] if len(parts) > 2 else None
                    })
                    
                    # Add breadcrumb for distributed tracing
                    add_breadcrumb(
                        message="Distributed trace context received from frontend",
                        category="distributed_tracing",
                        level="debug",
                        data=transaction_context
                    )
            except Exception as e:
                logger.warning(f"Failed to parse sentry-trace header: {e}")
        
        # Set up Sentry scope for this request
        with sentry_sdk.push_scope() as scope:
            # Set distributed tracing context
            if transaction_context:
                scope.set_context("distributed_tracing", transaction_context)
            
            # Add request context
            await self._add_request_context(request, scope)
            
            try:
                # Process request
                response = await call_next(request)
                
                # Add distributed tracing headers to response for frontend correlation
                if sentry_trace:
                    response.headers["x-backend-trace-id"] = transaction_context.get("parent_trace_id", "unknown")
                
                # Add response context
                self._add_response_context(response, scope, start_time)
                
                # Add success breadcrumb
                add_breadcrumb(
                    message=f"Request completed successfully",
                    category="http.response",
                    level="info",
                    data={
                        "status_code": response.status_code,
                        "duration_ms": round((time.time() - start_time) * 1000, 2),
                        "path": str(request.url.path),
                        "method": request.method,
                        "trace_correlated": bool(sentry_trace)
                    }
                )
                
                return response
                
            except Exception as exc:
                # Capture exception with enhanced context including distributed tracing
                self._capture_request_exception(exc, request, scope, start_time, transaction_context)
                
                # Return error response
                return await self._create_error_response(exc, request)
    
    async def _add_request_context(self, request: Request, scope) -> None:
        """Add comprehensive request context to Sentry scope"""
        
        # Basic request information
        set_tag("request.method", request.method)
        set_tag("request.path", request.url.path)
        
        # Identify feature/service based on path
        path = request.url.path
        if path.startswith("/api/auth"):
            set_tag("feature", "authentication")
            set_tag("service", "auth_service")
            set_tag("critical", "true")
        elif path.startswith("/api/courses"):
            set_tag("feature", "course_generation")
            set_tag("service", "ai_service")
            set_tag("ai_powered", "true")
        elif path.startswith("/api/clients"):
            set_tag("feature", "client_management")
            set_tag("service", "client_service")
        elif path.startswith("/health") or path == "/":
            set_tag("feature", "health_check")
            set_tag("service", "system")
        
        # Request context
        request_context = {
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "user_agent": request.headers.get("user-agent", "unknown"),
            "content_type": request.headers.get("content-type"),
            "content_length": request.headers.get("content-length"),
        }
        
        # Add headers (filtered)
        if self.capture_headers:
            filtered_headers = {}
            for key, value in request.headers.items():
                if key.lower() in self.sensitive_headers:
                    filtered_headers[key] = "[Filtered]"
                else:
                    filtered_headers[key] = value
            request_context["headers"] = filtered_headers
        
        # Add request body for non-GET requests (filtered)
        if self.capture_body and request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await self._get_filtered_request_body(request)
                if body:
                    request_context["body"] = body
            except Exception as e:
                logger.warning(f"Failed to capture request body: {e}")
                request_context["body"] = "[Failed to capture]"
        
        set_context("request", request_context)
        
        # Add breadcrumb for request start
        add_breadcrumb(
            message=f"Processing {request.method} {request.url.path}",
            category="http.request",
            level="info",
            data={
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
            }
        )
    
    def _add_response_context(self, response: Response, scope, start_time: float) -> None:
        """Add response context to Sentry scope"""
        
        duration_ms = round((time.time() - start_time) * 1000, 2)
        
        set_tag("response.status_code", response.status_code)
        set_tag("response.duration_ms", duration_ms)
        
        # Performance monitoring tags
        if duration_ms > 5000:  # > 5 seconds
            set_tag("performance", "slow")
        elif duration_ms > 1000:  # > 1 second
            set_tag("performance", "moderate")
        else:
            set_tag("performance", "fast")
        
        # Response context
        response_context = {
            "status_code": response.status_code,
            "duration_ms": duration_ms,
            "headers": dict(response.headers) if hasattr(response, 'headers') else {},
        }
        
        # Add content length if available
        if hasattr(response, 'headers') and 'content-length' in response.headers:
            response_context["content_length"] = response.headers["content-length"]
        
        set_context("response", response_context)
    
    async def _get_filtered_request_body(self, request: Request) -> Optional[Dict[str, Any]]:
        """Get request body with sensitive data filtered"""
        
        try:
            # Read body
            body = await request.body()
            if not body:
                return None
            
            # Try to parse JSON
            content_type = request.headers.get("content-type", "")
            if "application/json" in content_type:
                try:
                    body_json = json.loads(body.decode())
                    return self._filter_sensitive_data(body_json)
                except json.JSONDecodeError:
                    return {"raw_body": body.decode()[:500] + "..." if len(body) > 500 else body.decode()}
            else:
                # For non-JSON bodies, just store first 500 characters
                return {"raw_body": body.decode()[:500] + "..." if len(body) > 500 else body.decode()}
                
        except Exception as e:
            logger.warning(f"Error reading request body: {e}")
            return None
    
    def _filter_sensitive_data(self, data: Any) -> Any:
        """Recursively filter sensitive data from request/response"""
        
        if isinstance(data, dict):
            filtered = {}
            for key, value in data.items():
                if key.lower() in self.sensitive_body_keys:
                    filtered[key] = "[Filtered]"
                else:
                    filtered[key] = self._filter_sensitive_data(value)
            return filtered
        elif isinstance(data, list):
            return [self._filter_sensitive_data(item) for item in data]
        else:
            return data
    
    def _capture_request_exception(self, exc: Exception, request: Request, scope, start_time: float, transaction_context: dict = None) -> None:
        """Capture exception with enhanced request context and distributed tracing"""
        
        duration_ms = round((time.time() - start_time) * 1000, 2)
        
        # Add error-specific tags
        set_tag("error", "true")
        set_tag("error_type", type(exc).__name__)
        set_tag("request_duration_ms", duration_ms)
        
        # Add distributed tracing correlation if available
        if transaction_context:
            set_tag("trace_correlated", "true")
            set_tag("parent_trace_id", transaction_context.get("parent_trace_id", "unknown"))
        
        # Add error breadcrumb with distributed tracing context
        breadcrumb_data = {
            "exception": str(exc),
            "duration_ms": duration_ms,
            "path": str(request.url.path),
            "method": request.method,
        }
        
        if transaction_context:
            breadcrumb_data["distributed_tracing"] = transaction_context
        
        add_breadcrumb(
            message=f"Request failed: {type(exc).__name__}",
            category="http.error",
            level="error",
            data=breadcrumb_data
        )
        
        # Capture the exception
        sentry_sdk.capture_exception(exc)
    
    async def _create_error_response(self, exc: Exception, request: Request) -> JSONResponse:
        """Create standardized error response"""
        
        # Log error for local debugging
        logger.error(f"Request failed: {request.method} {request.url.path} - {type(exc).__name__}: {str(exc)}")
        
        # Determine appropriate status code and message
        if hasattr(exc, 'status_code'):
            status_code = exc.status_code
            detail = str(exc) if hasattr(exc, 'detail') else str(exc)
        else:
            status_code = 500
            detail = "Internal Server Error"
        
        return JSONResponse(
            status_code=status_code,
            content={
                "error": True,
                "message": detail,
                "type": type(exc).__name__,
                "timestamp": time.time(),
                "path": str(request.url.path),
                "method": request.method,
            }
        )