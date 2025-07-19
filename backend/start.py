"""
Backend startup script for development
"""

import asyncio
import uvicorn
from database import test_connection, init_db

async def startup():
    """Initialize backend services"""
    print("🚀 Starting B2B English Training Platform Backend...")
    
    # Test database connection
    print("📊 Testing database connection...")
    if await test_connection():
        print("✅ Database connection successful")
    else:
        print("❌ Database connection failed")
        return
    
    # Initialize database tables
    print("🏗️ Initializing database tables...")
    await init_db()
    
    print("✅ Backend initialization complete!")
    print("🌐 Starting FastAPI server on http://localhost:8000")
    print("📚 API documentation available at http://localhost:8000/docs")

if __name__ == "__main__":
    # Run startup
    asyncio.run(startup())
    
    # Start server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )