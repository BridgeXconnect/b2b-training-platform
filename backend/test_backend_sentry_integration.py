#!/usr/bin/env python3
"""
Backend Sentry Integration Test Script
Tests comprehensive error handling and monitoring across all FastAPI routes
"""

import asyncio
import json
import httpx
import os
import sys
from datetime import datetime
from typing import Dict, List

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpassword123"

class BackendSentryIntegrationTester:
    """Comprehensive tester for backend Sentry integration"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.auth_token = None
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        
        if success:
            self.test_results["passed"] += 1
        else:
            self.test_results["failed"] += 1
            self.test_results["errors"].append(f"{test_name}: {details}")
    
    async def test_basic_health_checks(self):
        """Test basic health check endpoints"""
        print("\n🔍 Testing Basic Health Checks...")
        
        # Test root endpoint
        try:
            response = await self.client.get(f"{BASE_URL}/")
            success = response.status_code == 200
            self.log_result("Root endpoint", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Root endpoint", False, str(e))
        
        # Test health endpoint
        try:
            response = await self.client.get(f"{BASE_URL}/health")
            success = response.status_code == 200
            if success:
                data = response.json()
                sentry_status = data.get("monitoring", {}).get("sentry", "unknown")
                self.log_result("Health endpoint", success, f"Sentry: {sentry_status}")
            else:
                self.log_result("Health endpoint", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Health endpoint", False, str(e))
        
        # Test detailed health endpoint
        try:
            response = await self.client.get(f"{BASE_URL}/api/health/detailed")
            success = response.status_code == 200
            if success:
                data = response.json()
                overall_status = data.get("overall", "unknown")
                components = data.get("components", {})
                self.log_result("Detailed health endpoint", success, 
                              f"Overall: {overall_status}, Components: {len(components)}")
            else:
                self.log_result("Detailed health endpoint", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Detailed health endpoint", False, str(e))
    
    async def test_sentry_debug_endpoint(self):
        """Test Sentry debug endpoint"""
        print("\n🐛 Testing Sentry Debug Endpoint...")
        
        try:
            response = await self.client.get(f"{BASE_URL}/sentry-debug")
            success = response.status_code == 200
            if success:
                data = response.json()
                error_captured = data.get("error_captured", False)
                sentry_status = data.get("sentry_status", "unknown")
                self.log_result("Sentry debug endpoint", success, 
                              f"Error captured: {error_captured}, Status: {sentry_status}")
            else:
                self.log_result("Sentry debug endpoint", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Sentry debug endpoint", False, str(e))
    
    async def test_error_recovery_endpoints(self):
        """Test backend error recovery endpoints"""
        print("\n🔧 Testing Error Recovery Endpoints...")
        
        # Test session cleanup endpoint
        try:
            response = await self.client.post(f"{BASE_URL}/api/session/cleanup")
            success = response.status_code == 200
            if success:
                data = response.json()
                actions = data.get("actions_performed", [])
                self.log_result("Session cleanup endpoint", success, 
                              f"Actions: {len(actions)}")
            else:
                self.log_result("Session cleanup endpoint", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Session cleanup endpoint", False, str(e))
        
        # Test frontend error reporting endpoint
        try:
            error_data = {
                "message": "Test frontend error",
                "component": "TestComponent",
                "stack": "Error: Test error\n    at TestComponent:123",
                "url": "/test-page",
                "userAgent": "Test User Agent",
                "props": {"testProp": "testValue"}
            }
            response = await self.client.post(f"{BASE_URL}/api/error/report", json=error_data)
            success = response.status_code == 200
            if success:
                data = response.json()
                error_id = data.get("sentry_error_id")
                self.log_result("Frontend error reporting", success, 
                              f"Error ID: {error_id}")
            else:
                self.log_result("Frontend error reporting", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Frontend error reporting", False, str(e))
    
    async def test_auth_endpoints(self):
        """Test authentication endpoints with Sentry monitoring"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test invalid login (should trigger Sentry error handling)
        try:
            login_data = {
                "email": "invalid@example.com",
                "password": "wrongpassword"
            }
            response = await self.client.post(f"{BASE_URL}/api/auth/login", json=login_data)
            success = response.status_code == 401  # Expected unauthorized
            self.log_result("Invalid login handling", success, 
                          f"Status: {response.status_code} (expected 401)")
        except Exception as e:
            self.log_result("Invalid login handling", False, str(e))
        
        # Test user registration (if available)
        try:
            register_data = {
                "email": f"test_{datetime.now().timestamp()}@example.com",
                "password": "TestPassword123!",
                "name": "Test User",
                "role": "sales",
                "company_id": "test-company"
            }
            response = await self.client.post(f"{BASE_URL}/api/auth/register", json=register_data)
            success = response.status_code in [200, 201, 400]  # 400 if user exists
            self.log_result("User registration", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("User registration", False, str(e))
    
    async def test_protected_endpoints(self):
        """Test protected endpoints without authentication"""
        print("\n🛡️ Testing Protected Endpoints (Unauthorized Access)...")
        
        # Test client requests endpoint without auth
        try:
            response = await self.client.get(f"{BASE_URL}/api/clients/requests")
            success = response.status_code == 401  # Expected unauthorized
            self.log_result("Client requests without auth", success, 
                          f"Status: {response.status_code} (expected 401)")
        except Exception as e:
            self.log_result("Client requests without auth", False, str(e))
        
        # Test course generation without auth
        try:
            response = await self.client.post(f"{BASE_URL}/api/courses/generate/test-id")
            success = response.status_code == 401  # Expected unauthorized
            self.log_result("Course generation without auth", success, 
                          f"Status: {response.status_code} (expected 401)")
        except Exception as e:
            self.log_result("Course generation without auth", False, str(e))
    
    async def test_invalid_requests(self):
        """Test invalid requests to trigger error handling"""
        print("\n⚠️ Testing Invalid Requests...")
        
        # Test invalid JSON data
        try:
            response = await self.client.post(
                f"{BASE_URL}/api/auth/login",
                content="invalid json data",
                headers={"Content-Type": "application/json"}
            )
            success = response.status_code == 422  # Validation error
            self.log_result("Invalid JSON handling", success, 
                          f"Status: {response.status_code} (expected 422)")
        except Exception as e:
            self.log_result("Invalid JSON handling", False, str(e))
        
        # Test nonexistent endpoint
        try:
            response = await self.client.get(f"{BASE_URL}/api/nonexistent/endpoint")
            success = response.status_code == 404  # Not found
            self.log_result("Nonexistent endpoint handling", success, 
                          f"Status: {response.status_code} (expected 404)")
        except Exception as e:
            self.log_result("Nonexistent endpoint handling", False, str(e))
    
    async def test_distributed_tracing(self):
        """Test distributed tracing headers"""
        print("\n🔗 Testing Distributed Tracing...")
        
        # Test with sentry-trace header
        try:
            headers = {
                "sentry-trace": "12345678901234567890123456789012-1234567890123456-1",
                "baggage": "test=value"
            }
            response = await self.client.get(f"{BASE_URL}/health", headers=headers)
            success = response.status_code == 200
            has_trace_header = "x-backend-trace-id" in response.headers
            self.log_result("Distributed tracing", success, 
                          f"Trace header in response: {has_trace_header}")
        except Exception as e:
            self.log_result("Distributed tracing", False, str(e))
    
    async def run_all_tests(self):
        """Run all backend Sentry integration tests"""
        print("🚀 Starting Backend Sentry Integration Tests")
        print(f"📍 Target URL: {BASE_URL}")
        print(f"🕒 Test started at: {datetime.now().isoformat()}")
        
        # Run test suites
        await self.test_basic_health_checks()
        await self.test_sentry_debug_endpoint()
        await self.test_error_recovery_endpoints()
        await self.test_auth_endpoints()
        await self.test_protected_endpoints()
        await self.test_invalid_requests()
        await self.test_distributed_tracing()
        
        # Print summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        print(f"📈 Success Rate: {(self.test_results['passed'] / (self.test_results['passed'] + self.test_results['failed']) * 100):.1f}%")
        
        if self.test_results['errors']:
            print("\n❌ FAILED TESTS:")
            for error in self.test_results['errors']:
                print(f"   • {error}")
        
        print(f"\n🕒 Test completed at: {datetime.now().isoformat()}")
        
        return self.test_results['failed'] == 0

async def main():
    """Main test runner"""
    print("Backend Sentry Integration Test Suite")
    print("=====================================")
    
    # Check if backend is running
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/health", timeout=5.0)
            if response.status_code != 200:
                print(f"❌ Backend not responding properly at {BASE_URL}")
                print("   Please ensure the backend is running with: uvicorn main:app --reload")
                return False
    except Exception as e:
        print(f"❌ Cannot connect to backend at {BASE_URL}")
        print(f"   Error: {str(e)}")
        print("   Please ensure the backend is running with: uvicorn main:app --reload")
        return False
    
    # Run tests
    async with BackendSentryIntegrationTester() as tester:
        success = await tester.run_all_tests()
        return success

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test runner error: {str(e)}")
        sys.exit(1)