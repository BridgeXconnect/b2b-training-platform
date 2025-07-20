"""
Reset database tables to fix schema issues
"""

import asyncio
from sqlalchemy import text
from database import engine
from models import Base

async def reset_database():
    """Drop all tables and recreate them"""
    print("🗑️ Dropping all existing tables...")
    
    async with engine.begin() as conn:
        # Drop all tables
        await conn.execute(text("DROP SCHEMA public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
        
        print("✅ All tables dropped")
    
    print("🏗️ Creating new tables...")
    async with engine.begin() as conn:
        # Create all tables with correct schema
        await conn.run_sync(Base.metadata.create_all)
        print("✅ New tables created successfully")

if __name__ == "__main__":
    asyncio.run(reset_database()) 