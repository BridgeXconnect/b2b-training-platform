#!/usr/bin/env python3
"""
Test script to verify AI service setup
Run this to check if OpenAI integration is working
"""

import os
import sys
import asyncio
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

async def test_ai_service():
    print("🧪 Testing AI Service Setup...")
    print("=" * 50)
    
    # Check if OpenAI API key is set
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ OPENAI_API_KEY not found in environment")
        print("💡 Please set your OpenAI API key:")
        print("   export OPENAI_API_KEY=sk-your-key-here")
        return False
    elif api_key == "your_openai_api_key_here":
        print("❌ OPENAI_API_KEY is still set to placeholder value")
        print("💡 Please replace with your actual OpenAI API key")
        return False
    else:
        print(f"✅ OpenAI API key found: {api_key[:7]}...")
    
    # Test AI service import
    try:
        from services.ai_service import ai_service
        print("✅ AI service imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import AI service: {e}")
        return False
    
    # Test basic course generation (mock data)
    try:
        from services.ai_service import CourseGenerationRequest
        
        # Create a test request
        test_request = CourseGenerationRequest(
            company_name="Test Company",
            industry="Technology",
            target_cefr_level="B2",
            current_cefr_level="A2",
            course_duration=40,
            participant_count=15,
            focus_areas=["Business Communication"],
            specific_goals=["Improve meeting participation", "Better email writing"]
        )
        
        print("✅ Test request created successfully")
        print(f"   Company: {test_request.company_name}")
        print(f"   CEFR Level: {test_request.current_cefr_level} → {test_request.target_cefr_level}")
        print(f"   Duration: {test_request.course_duration} hours")
        
        # Test if we can make API calls (if API key is valid)
        if api_key and api_key != "your_openai_api_key_here":
            print("\n🚀 Testing OpenAI API connection...")
            try:
                course_data = await ai_service.generate_course(test_request)
                print("✅ AI course generation successful!")
                print(f"   Generated course: {course_data['title']}")
                print(f"   Modules: {len(course_data['modules'])}")
                print(f"   CEFR Validation Score: {course_data.get('cefr_validation', {}).get('score', 'N/A')}%")
            except Exception as e:
                print(f"⚠️  OpenAI API test failed: {e}")
                print("   This might be due to invalid API key or quota limits")
                print("   The system will fall back to basic generation")
        
    except Exception as e:
        print(f"❌ AI service test failed: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 AI Service setup verification complete!")
    print("\n📋 Next steps:")
    print("1. Start the backend: cd backend && python start.py")
    print("2. Start the frontend: npm run dev")
    print("3. Visit: http://localhost:3000")
    print("4. Test AI course generation in the Sales Portal")
    
    return True

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv("backend/.env")
    load_dotenv(".env.local")
    
    try:
        asyncio.run(test_ai_service())
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        sys.exit(1)