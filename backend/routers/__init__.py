# API Routers
from .auth import auth_router
from .clients import clients_router
from .courses import courses_router

__all__ = ["auth_router", "clients_router", "courses_router"]