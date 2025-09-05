"""
Middleware package for FastAPI backend
"""

from .sentry_middleware import SentryMiddleware

__all__ = ['SentryMiddleware']