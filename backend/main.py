"""
FastAPI Backend for B2B English Training Platform
BMAD Story 4: Database & API Backend Foundation
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
from datetime import datetime, timedelta
from typing import List, Optional
import uvicorn

# Import our models and database
from models import *
from database import get_db, init_db
from auth import create_access_token, verify_token, get_current_user
from routers import auth_router, clients_router, courses_router

app = FastAPI(
    title="B2B English Training Platform API",
    description="Backend API for CEFR-aligned course generation with SOP integration",
    version="1.0.0"
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

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    await init_db()

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
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )