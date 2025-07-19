# 🚀 Local Development Setup Guide

## Quick Start (5 minutes)

### 1. Frontend Setup
```bash
# Navigate to project root
cd "/Users/roymkhabela/Downloads/Ai course platform v2"

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your OpenAI API key to .env.local
# OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Start frontend (auto-refresh on changes)
npm run dev
```
**Frontend will be available at: http://localhost:3000**

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Create backend environment file
cp .env.example .env

# Add your OpenAI API key to backend .env
# OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Start backend server
python start.py
```
**Backend API will be available at: http://localhost:8000**

## 🧪 Test the AI Course Generation

1. **Open Frontend**: http://localhost:3000
2. **Navigate to Sales Portal**: Click the main navigation
3. **Fill Client Request Form**:
   - Company Name: "Test Corp"
   - Industry: "Technology"
   - Current CEFR Level: A2
   - Target CEFR Level: B2
   - Course Duration: 40 hours
   - Participants: 15

4. **Generate AI Course**:
   - Click "Generate CEFR-Aligned Course"
   - Watch real-time AI generation with OpenAI GPT-4
   - See CEFR validation scores and course structure

## 🔑 Required Environment Variables

### Frontend (.env.local)
```env
OPENAI_API_KEY=sk-your-actual-key-here
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend (.env)
```env
OPENAI_API_KEY=sk-your-actual-key-here
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_language_platform
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
```

## 🎯 What You'll See

### With OpenAI API Key:
- ✅ Real AI-generated course content
- ✅ CEFR validation and scoring
- ✅ Company-specific SOP integration
- ✅ Intelligent module and lesson generation

### Without OpenAI API Key:
- ⚠️ Fallback to basic course generation
- ⚠️ Warning messages about AI features disabled

## 🔧 Troubleshooting

### Frontend Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend Issues
```bash
# Reinstall Python dependencies
pip install -r requirements.txt --force-reinstall
python start.py
```

### Database Issues
The backend uses in-memory SQLite by default, so no database setup needed for testing.

## 📝 Live Development Workflow

1. **I make changes** → Files auto-save
2. **Frontend auto-refreshes** → You see changes instantly
3. **Backend requires restart** → I'll let you know when to restart
4. **You test and provide feedback** → I iterate based on your input

## 🚀 Ready to Test!

Once both servers are running:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

You'll be able to see real AI course generation in action! 🎉