"""
Database configuration and connection for Supabase PostgreSQL
Enhanced with Sentry monitoring for database operations
"""

import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from models import Base
import asyncpg
from typing import AsyncGenerator
import sentry_sdk
from config.sentry_config import SentryConfig

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Convert for async usage
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Create async engine with connection pooling
engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=os.getenv("DEBUG", "false").lower() == "true",  # Only echo in debug mode
    future=True,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,
    pool_recycle=300
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

async def init_db():
    """Initialize database tables with Sentry monitoring"""
    try:
        with sentry_sdk.start_transaction(op="database", name="init_db"):
            async with engine.begin() as conn:
                # Create all tables
                await conn.run_sync(Base.metadata.create_all)
                logger.info("✅ Database tables created successfully")
                
                # Add breadcrumb for successful initialization
                sentry_sdk.add_breadcrumb(
                    message="Database tables initialized",
                    category="database",
                    level="info"
                )
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        SentryConfig.capture_database_error(e, table="all_tables")
        raise

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session with Sentry monitoring"""
    async with AsyncSessionLocal() as session:
        try:
            # Add breadcrumb for database session start
            sentry_sdk.add_breadcrumb(
                message="Database session started",
                category="database",
                level="debug"
            )
            
            yield session
            await session.commit()
            
            # Add breadcrumb for successful commit
            sentry_sdk.add_breadcrumb(
                message="Database session committed",
                category="database",
                level="debug"
            )
            
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            
            # Capture database error with context
            SentryConfig.capture_database_error(e)
            raise
        finally:
            await session.close()

# Test database connection
async def test_connection():
    """Test database connection with Sentry monitoring"""
    try:
        with sentry_sdk.start_transaction(op="database", name="test_connection"):
            async with engine.begin() as conn:
                result = await conn.execute(text("SELECT 1"))
                logger.info("✅ Database connection successful")
                
                # Add breadcrumb for successful connection test
                sentry_sdk.add_breadcrumb(
                    message="Database connection test successful",
                    category="database",
                    level="info"
                )
                return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        SentryConfig.capture_database_error(e, query="SELECT 1")
        return False