# 🚀 AI Course Platform v2 - Quick Start Guide

## Prerequisites

- **Node.js** 18+ 
- **Python** 3.8+
- **PostgreSQL** database (Supabase configured)

## 🏃‍♂️ Quick Start (2 minutes)

### 1. Start Backend Server
```bash
# Option A: Use startup script
./start-backend.sh

# Option B: Manual startup
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start Frontend (in new terminal)
```bash
npm run dev
```

### 3. Access the Platform
- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:8000/docs

## ✅ Verify Integration

### Test Backend Health
```bash
curl http://localhost:8000/health
```

### Run Integration Tests
```bash
node test-backend-integration.js
```

## 🔑 Environment Setup

### Backend Environment (backend/.env)
```bash
DATABASE_URL=postgresql://postgres.qpxvicjunijsydgigmmd:V2phiPjO0E7NeDP0@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-key
```

### Frontend Environment (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
OPENAI_API_KEY=your-openai-key
```

## 🎯 Key Features Ready to Use

### User Authentication
- Register new users at `/register`
- Login with persistent sessions
- JWT token management
- Role-based access control

### BMAD AI System
- Chat interface with AI tutoring
- Content generation and analysis
- Assessment creation
- Study plan development
- All results persisted to database

### Course Management
- Create and edit courses
- Generate CEFR-aligned content
- SOP document integration
- Progress tracking

## 🔧 Development Commands

```bash
# Backend
cd backend
python -m uvicorn main:app --reload    # Start dev server
python -c "from database import test_connection; import asyncio; asyncio.run(test_connection())"  # Test DB

# Frontend  
npm run dev                            # Start dev server
npm run build                         # Build for production
npm run test                          # Run tests

# Integration
node test-backend-integration.js      # Test full integration
```

## 📊 System Status

### Health Checks
- **Backend**: http://localhost:8000/health
- **Database**: Included in backend health check
- **Frontend**: Automatic health monitoring

### Logs
- **Backend**: Console output with SQL logging
- **Frontend**: Browser console and terminal
- **Integration**: Detailed test output

## 🐛 Troubleshooting

### Backend Won't Start
1. Check database connection in backend/.env
2. Verify Python dependencies: `pip install -r requirements.txt`
3. Test database: Run health check

### Frontend Won't Connect
1. Verify NEXT_PUBLIC_API_URL points to http://localhost:8000
2. Check CORS settings in backend/main.py
3. Ensure backend is running

### Authentication Issues
1. Check JWT_SECRET in backend/.env
2. Clear browser localStorage
3. Verify user registration works

## 📚 API Documentation

Once backend is running:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Backend health check returns "healthy"
- ✅ Frontend loads without errors
- ✅ User can register/login successfully
- ✅ BMAD AI chat responds to messages
- ✅ Integration tests pass (6/7 or better)

## 🚀 Ready for Production!

The platform is now fully integrated and ready for:
- User registration and authentication
- AI-powered course creation
- Persistent data storage
- Real-time BMAD agent interactions
- Progress tracking and analytics

Happy learning! 🎓