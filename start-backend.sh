#!/bin/bash

# Start Backend Server Script
# Starts the FastAPI backend server for the AI Course Platform

set -e

echo "🚀 Starting AI Course Platform Backend..."

# Check if we're in the correct directory
if [ ! -f "backend/main.py" ]; then
    echo "❌ Error: backend/main.py not found. Make sure you're in the project root directory."
    exit 1
fi

# Check if Python and required packages are available
if ! command -v python &> /dev/null; then
    echo "❌ Error: Python not found. Please install Python 3.8+."
    exit 1
fi

# Navigate to backend directory
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update requirements
echo "📚 Installing/updating requirements..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found in backend directory."
    echo "Please copy .env.example to .env and configure your environment variables."
    exit 1
fi

# Test database connection
echo "🔍 Testing database connection..."
python -c "
import asyncio
from database import test_connection
result = asyncio.run(test_connection())
if not result:
    print('❌ Database connection failed. Please check your DATABASE_URL in .env')
    exit(1)
print('✅ Database connection successful')
"

if [ $? -ne 0 ]; then
    echo "❌ Database connection test failed. Please check your configuration."
    exit 1
fi

# Initialize database tables
echo "🗄️  Initializing database tables..."
python -c "
import asyncio
from database import init_db
asyncio.run(init_db())
print('✅ Database initialized successfully')
"

# Start the server
echo "🌟 Starting FastAPI server on http://localhost:8000"
echo "📊 API Documentation available at http://localhost:8000/docs"
echo "❤️  Health check available at http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start server with uvicorn
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level info