"""
Sentry Configuration for FastAPI Backend
Comprehensive error monitoring and performance tracking matching frontend Sentry v9 capabilities
"""

import os
import sys
import logging
from typing import Dict, Any, Optional
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.asyncio import AsyncioIntegration
from sentry_sdk.integrations.httpx import HttpxIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.stdlib import StdlibIntegration

# Configure logger
logger = logging.getLogger(__name__)

class SentryConfig:
    """Sentry configuration management for FastAPI backend"""
    
    def __init__(self):
        self.dsn = os.getenv('SENTRY_DSN', 'https://e0f790fef4cd1dbf8f9e2e12e44ca625@o4509757514842112.ingest.us.sentry.io/4509757643620352')
        self.environment = os.getenv('ENVIRONMENT', 'development')
        self.debug = os.getenv('DEBUG', 'false').lower() == 'true'
        self.release = os.getenv('VERCEL_GIT_COMMIT_SHA', 'development')
        
    def init_sentry(self) -> None:
        """Initialize Sentry with comprehensive FastAPI backend monitoring"""
        
        if not self.dsn:
            logger.warning("⚠️ SENTRY_DSN not configured. Sentry monitoring disabled.")
            return
            
        # Configure logging integration for structured error capture
        logging_integration = LoggingIntegration(
            level=logging.INFO,        # Capture info and above as breadcrumbs
            event_level=logging.ERROR  # Send errors as events
        )
        
        # Production vs Development configuration
        traces_sample_rate = 0.1 if self.environment == 'production' else 1.0
        profiles_sample_rate = 0.1 if self.environment == 'production' else 1.0
        
        sentry_sdk.init(
            dsn=self.dsn,
            debug=self.debug,
            environment=self.environment,
            release=self.release,
            
            # Performance monitoring
            traces_sample_rate=traces_sample_rate,
            profiles_sample_rate=profiles_sample_rate,
            
            # Comprehensive integrations for FastAPI backend
            integrations=[
                # FastAPI and Starlette integration for request/response monitoring
                FastApiIntegration(),
                StarletteIntegration(),
                
                # Database monitoring with SQLAlchemy
                SqlalchemyIntegration(),
                
                # Async operations monitoring
                AsyncioIntegration(),
                
                # HTTP client monitoring (for OpenAI, Supabase calls)
                HttpxIntegration(),
                
                # Logging integration
                logging_integration,
                
                # Standard library integration
                StdlibIntegration(),
            ],
            
            # Enhanced error filtering for backend services
            before_send=self._before_send_event,
            before_send_transaction=self._before_send_transaction,
            
            # Distributed tracing for API calls
            trace_propagation_targets=[
                "localhost",
                "127.0.0.1",
                "0.0.0.0",
                r"^/api/",
                r"openai\.com",
                r"supabase\.co",
                r"supabase\.co/rest/",
            ],
            
            # Request data inclusion
            send_default_pii=False,  # Don't send PII by default for security
            attach_stacktrace=True,
            max_breadcrumbs=50,
        )
        
        # Add backend-specific context
        sentry_sdk.set_context("backend", {
            "type": "fastapi",
            "python_version": sys.version,
            "sentry_sdk_version": sentry_sdk.VERSION,
            "features": ["openai", "supabase", "sqlalchemy", "async"],
        })
        
        # Set global tags
        sentry_sdk.set_tag("component", "backend-api")
        sentry_sdk.set_tag("runtime", "python")
        sentry_sdk.set_tag("framework", "fastapi")
        sentry_sdk.set_tag("version", "2.0.0")
        
        logger.info("✅ Sentry initialized for FastAPI backend monitoring")
    
    def _before_send_event(self, event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Filter and enhance events before sending to Sentry"""
        
        # Enhanced logging in development
        if self.debug:
            logger.info("🔍 Sentry Backend Event - Type: %s, Exception: %s", 
                       event.get('level'), hint.get('exc_info'))
        
        # Filter expected errors to avoid noise
        if event.get('exception'):
            exception = hint.get('exc_info')
            if exception and len(exception) > 1:
                error = exception[1]
                if hasattr(error, 'args') and error.args:
                    error_message = str(error.args[0]) if error.args else str(error)
                    
                    # Filter expected AI service issues
                    expected_ai_errors = [
                        'Rate limit exceeded',
                        'Request timeout',
                        'Token limit exceeded',
                        'Model temporarily unavailable',
                        'OpenAI API error',
                        'Connection timeout',
                    ]
                    
                    if any(expected in error_message for expected in expected_ai_errors):
                        logger.warning("⚠️ Expected AI service issue: %s", error_message)
                        return None
                    
                    # Filter database connection retries (expected during scaling)
                    if ('connection' in error_message.lower() and 
                        ('retry' in error_message.lower() or 'timeout' in error_message.lower())):
                        logger.warning("⚠️ Database connection issue (retry expected): %s", error_message)
                        return None
        
        # Enhance backend events with context
        event.setdefault('contexts', {})
        event['contexts']['backend_api'] = {
            'component': 'fastapi',
            'python_version': sys.version_info[:2],
            'environment': self.environment,
            'features': ['ai_service', 'database', 'authentication', 'course_generation'],
        }
        
        # Sanitize request data - remove sensitive information
        if 'request' in event:
            request = event['request']
            
            # Remove sensitive headers
            if 'headers' in request:
                sensitive_headers = ['authorization', 'x-api-key', 'cookie', 'x-supabase-auth']
                for header in sensitive_headers:
                    if header in request['headers']:
                        request['headers'][header] = '[Filtered]'
            
            # Remove sensitive data from request body
            if 'data' in request and isinstance(request['data'], dict):
                sensitive_fields = ['password', 'token', 'api_key', 'secret']
                for field in sensitive_fields:
                    if field in request['data']:
                        request['data'][field] = '[Filtered]'
        
        return event
    
    def _before_send_transaction(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance transaction events with backend-specific context"""
        
        transaction_name = event.get('transaction', '')
        
        # Add feature tags based on API endpoints
        tags = event.setdefault('tags', {})
        
        if '/auth/' in transaction_name:
            tags.update({
                'feature': 'authentication',
                'service': 'auth_service',
                'critical': 'true'
            })
        elif '/courses/' in transaction_name:
            tags.update({
                'feature': 'course_generation',
                'service': 'ai_service',
                'ai_powered': 'true'
            })
        elif '/clients/' in transaction_name:
            tags.update({
                'feature': 'client_management',
                'service': 'client_service'
            })
        elif 'openai' in transaction_name.lower():
            tags.update({
                'feature': 'ai_integration',
                'service': 'openai',
                'external': 'true'
            })
        elif 'database' in transaction_name.lower() or 'supabase' in transaction_name.lower():
            tags.update({
                'feature': 'database',
                'service': 'supabase',
                'external': 'true'
            })
        
        return event
    
    def _get_initial_scope(self) -> Dict[str, Any]:
        """Get initial scope configuration for backend"""
        return {
            'tags': {
                'component': 'ai-course-platform-backend',
                'runtime': 'python',
                'platform': 'fastapi',
                'version': '2.0.0',
                'environment': self.environment,
            },
            'contexts': {
                'app': {
                    'name': 'AI Course Platform Backend',
                    'version': '2.0.0',
                    'build': self.release,
                    'component': 'api-server',
                },
                'runtime': {
                    'name': 'python',
                    'version': sys.version,
                },
                'os': {
                    'name': sys.platform,
                },
            },
        }
    
    @staticmethod
    def capture_ai_service_error(error: Exception, context: Dict[str, Any] = None) -> str:
        """Capture AI service specific errors with enhanced context"""
        with sentry_sdk.push_scope() as scope:
            scope.set_tag("service", "ai_service")
            scope.set_tag("error_type", "ai_service_error")
            
            if context:
                scope.set_context("ai_service", context)
            
            return sentry_sdk.capture_exception(error)
    
    @staticmethod
    def capture_database_error(error: Exception, query: str = None, table: str = None) -> str:
        """Capture database specific errors with enhanced context"""
        with sentry_sdk.push_scope() as scope:
            scope.set_tag("service", "database")
            scope.set_tag("error_type", "database_error")
            
            context = {}
            if query:
                # Sanitize query - remove potential sensitive data
                context["query"] = query[:500] + "..." if len(query) > 500 else query
            if table:
                context["table"] = table
            
            if context:
                scope.set_context("database", context)
            
            return sentry_sdk.capture_exception(error)
    
    @staticmethod
    def capture_auth_error(error: Exception, user_id: str = None, endpoint: str = None) -> str:
        """Capture authentication specific errors with enhanced context"""
        with sentry_sdk.push_scope() as scope:
            scope.set_tag("service", "authentication")
            scope.set_tag("error_type", "auth_error")
            
            context = {}
            if user_id:
                context["user_id"] = user_id
            if endpoint:
                context["endpoint"] = endpoint
            
            if context:
                scope.set_context("authentication", context)
            
            return sentry_sdk.capture_exception(error)

# Global Sentry configuration instance
sentry_config = SentryConfig()