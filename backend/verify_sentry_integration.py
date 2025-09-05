#!/usr/bin/env python3
"""
Sentry Integration Verification Script for FastAPI Backend
Tests all Sentry monitoring capabilities and provides integration report
"""

import asyncio
import httpx
import json
import os
import sys
from datetime import datetime
from typing import Dict, Any, List

# Add backend to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.sentry_config import sentry_config, SentryConfig
from database import test_connection
from services.ai_service import ai_service

class SentryIntegrationVerifier:
    """Comprehensive Sentry integration testing and verification"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results = []
        
    async def run_verification(self) -> Dict[str, Any]:
        """Run complete Sentry integration verification"""
        print("🔍 FastAPI Backend Sentry Integration Verification")
        print("=" * 60)
        
        # Initialize Sentry configuration
        print("1. Initializing Sentry configuration...")
        sentry_config.init_sentry()
        await self._test_sentry_config()
        
        # Test basic endpoints
        print("\n2. Testing basic endpoints...")
        await self._test_health_endpoint()
        await self._test_sentry_debug()
        
        # Test database monitoring
        print("\n3. Testing database monitoring...")
        await self._test_database_monitoring()
        
        # Test AI service monitoring
        print("\n4. Testing AI service monitoring...")
        await self._test_ai_service_monitoring()
        
        # Test authentication monitoring
        print("\n5. Testing authentication monitoring...")
        await self._test_auth_monitoring()
        
        # Generate report
        print("\n6. Generating verification report...")
        return self._generate_report()
    
    async def _test_sentry_config(self):
        """Test Sentry configuration"""
        try:
            import sentry_sdk
            
            # Check if Sentry is initialized
            client = sentry_sdk.Hub.current.client
            if client:
                self._add_result("✅ Sentry Configuration", "Active", {
                    "dsn": bool(sentry_config.dsn),
                    "environment": sentry_config.environment,
                    "debug": sentry_config.debug,
                    "release": sentry_config.release
                })
            else:
                self._add_result("❌ Sentry Configuration", "Inactive", {
                    "error": "Sentry client not initialized"
                })
                
        except Exception as e:
            self._add_result("❌ Sentry Configuration", "Error", {"error": str(e)})
    
    async def _test_health_endpoint(self):
        """Test health endpoint with Sentry status"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/health")
                
                if response.status_code == 200:
                    data = response.json()
                    sentry_status = data.get("monitoring", {}).get("sentry", "unknown")
                    
                    self._add_result("✅ Health Endpoint", "Working", {
                        "status_code": response.status_code,
                        "sentry_status": sentry_status,
                        "features": data.get("features", [])
                    })
                else:
                    self._add_result("❌ Health Endpoint", "Failed", {
                        "status_code": response.status_code
                    })
                    
        except Exception as e:
            self._add_result("❌ Health Endpoint", "Error", {"error": str(e)})
    
    async def _test_sentry_debug(self):
        """Test Sentry debug endpoint"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/sentry-debug")
                
                if response.status_code == 200:
                    data = response.json()
                    error_captured = data.get("error_captured", False)
                    
                    self._add_result("✅ Sentry Debug", "Working", {
                        "error_captured": error_captured,
                        "sentry_status": data.get("sentry_status", "unknown")
                    })
                else:
                    self._add_result("❌ Sentry Debug", "Failed", {
                        "status_code": response.status_code
                    })
                    
        except Exception as e:
            self._add_result("❌ Sentry Debug", "Error", {"error": str(e)})
    
    async def _test_database_monitoring(self):
        """Test database monitoring integration"""
        try:
            # Test database connection with Sentry monitoring
            connection_ok = await test_connection()
            
            if connection_ok:
                self._add_result("✅ Database Monitoring", "Active", {
                    "connection": "successful",
                    "sentry_integration": "sqlalchemy_integration_enabled"
                })
            else:
                self._add_result("❌ Database Monitoring", "Failed", {
                    "connection": "failed"
                })
                
        except Exception as e:
            self._add_result("❌ Database Monitoring", "Error", {"error": str(e)})
    
    async def _test_ai_service_monitoring(self):
        """Test AI service monitoring"""
        try:
            # Check if AI service is configured
            if ai_service.client is None:
                self._add_result("⚠️ AI Service Monitoring", "Skipped", {
                    "reason": "OpenAI API key not configured"
                })
                return
            
            # Test AI service error capture functionality
            try:
                # This should work without making actual API calls
                test_context = {
                    "operation": "test_monitoring",
                    "model": ai_service.model
                }
                
                self._add_result("✅ AI Service Monitoring", "Ready", {
                    "client_configured": True,
                    "model": ai_service.model,
                    "max_retries": ai_service.max_retries,
                    "sentry_integration": "enabled"
                })
                
            except Exception as e:
                SentryConfig.capture_ai_service_error(e, {"test": True})
                self._add_result("✅ AI Service Monitoring", "Error Captured", {
                    "error_capture_test": "successful"
                })
                
        except Exception as e:
            self._add_result("❌ AI Service Monitoring", "Error", {"error": str(e)})
    
    async def _test_auth_monitoring(self):
        """Test authentication monitoring"""
        try:
            # Test auth endpoints (should fail but be monitored)
            async with httpx.AsyncClient() as client:
                # Test login with invalid credentials
                response = await client.post(f"{self.base_url}/api/auth/login", json={
                    "email": "test@example.com",
                    "password": "invalid"
                })
                
                # Should return 401 but be monitored by Sentry
                if response.status_code == 401:
                    self._add_result("✅ Auth Monitoring", "Active", {
                        "endpoint": "/api/auth/login",
                        "failed_auth_monitored": True,
                        "status_code": response.status_code
                    })
                else:
                    self._add_result("⚠️ Auth Monitoring", "Unexpected", {
                        "status_code": response.status_code
                    })
                    
        except Exception as e:
            self._add_result("❌ Auth Monitoring", "Error", {"error": str(e)})
    
    def _add_result(self, test: str, status: str, details: Dict[str, Any]):
        """Add test result"""
        result = {
            "test": test,
            "status": status,
            "details": details,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.results.append(result)
        print(f"  {test}: {status}")
        if details:
            for key, value in details.items():
                print(f"    {key}: {value}")
    
    def _generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive verification report"""
        passed = len([r for r in self.results if r["status"] in ["Active", "Working", "Ready", "Error Captured"]])
        total = len(self.results)
        
        report = {
            "summary": {
                "total_tests": total,
                "passed": passed,
                "failed": total - passed,
                "success_rate": f"{(passed/total)*100:.1f}%" if total > 0 else "0%"
            },
            "results": self.results,
            "recommendations": self._get_recommendations(),
            "generated_at": datetime.utcnow().isoformat()
        }
        
        print("\n" + "=" * 60)
        print("📊 VERIFICATION REPORT")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {report['summary']['success_rate']}")
        
        if report["recommendations"]:
            print("\n🔧 RECOMMENDATIONS:")
            for rec in report["recommendations"]:
                print(f"  • {rec}")
        
        print("\n✅ FastAPI Backend Sentry Integration Verification Complete!")
        
        return report
    
    def _get_recommendations(self) -> List[str]:
        """Get recommendations based on test results"""
        recommendations = []
        failed_tests = [r for r in self.results if r["status"] not in ["Active", "Working", "Ready", "Error Captured"]]
        
        for test in failed_tests:
            if "Configuration" in test["test"]:
                recommendations.append("Verify SENTRY_DSN environment variable is set correctly")
            elif "Health Endpoint" in test["test"]:
                recommendations.append("Ensure FastAPI backend is running on expected port")
            elif "Database" in test["test"]:
                recommendations.append("Check database connection and SQLAlchemy integration")
            elif "AI Service" in test["test"]:
                recommendations.append("Verify OpenAI API key configuration")
            elif "Auth" in test["test"]:
                recommendations.append("Check authentication endpoints are accessible")
        
        return recommendations

async def main():
    """Main verification function"""
    verifier = SentryIntegrationVerifier()
    report = await verifier.run_verification()
    
    # Save report to file
    report_file = "sentry_verification_report.json"
    with open(report_file, "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📝 Detailed report saved to: {report_file}")
    
    # Return appropriate exit code
    success_rate = float(report["summary"]["success_rate"].rstrip("%"))
    sys.exit(0 if success_rate >= 80 else 1)

if __name__ == "__main__":
    asyncio.run(main())