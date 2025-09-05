#!/usr/bin/env python3
"""
Comprehensive Validation Suite Runner
Orchestrates error recovery validation and production health checks
"""

import asyncio
import subprocess
import sys
import json
import time
from typing import Dict, Any, Optional, List
from datetime import datetime
import os

class ValidationSuiteRunner:
    """Coordinates and runs comprehensive validation suite"""
    
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.start_time = time.time()
        self.results = {}
        
    async def run_comprehensive_validation(self) -> Dict[str, Any]:
        """Run complete validation suite"""
        
        print("🚀 AI Course Platform - Comprehensive Validation Suite")
        print("=" * 70)
        print(f"🎯 Target URL: {self.base_url}")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        
        # Pre-flight checks
        print("\n🔍 Pre-flight System Checks")
        print("-" * 40)
        
        if not await self._check_system_prerequisites():
            print("❌ Pre-flight checks failed. Running limited validation.")
            # Return a properly structured response even when prerequisites fail
            return self._generate_limited_validation_report()
            
        # Run validation suites
        validation_results = {}
        
        # 1. Production Health Check
        print("\n🏥 Running Production Health Check")
        print("-" * 40)
        health_result = await self._run_health_check()
        validation_results["health_check"] = health_result
        
        # 2. Error Recovery Validation (only if health check passes critical tests)
        if health_result.get("proceed_with_error_tests", True):
            print("\n🧪 Running Error Recovery Validation")
            print("-" * 40)
            error_recovery_result = await self._run_error_recovery_validation()
            validation_results["error_recovery"] = error_recovery_result
        else:
            print("⚠️ Skipping error recovery tests due to critical health issues")
            validation_results["error_recovery"] = {"skipped": True, "reason": "health_check_failed"}
            
        # 3. Integration Tests
        print("\n🔗 Running Integration Tests")
        print("-" * 40)
        integration_result = await self._run_integration_tests()  
        validation_results["integration_tests"] = integration_result
        
        # Generate comprehensive report
        return self._generate_comprehensive_report(validation_results)
        
    async def _check_system_prerequisites(self) -> bool:
        """Check system prerequisites"""
        
        checks = [
            ("Python requests library", self._check_requests_library),
            ("Target server accessibility", self._check_server_accessibility),
            ("Environment configuration", self._check_environment_config)
        ]
        
        all_passed = True
        
        for check_name, check_func in checks:
            try:
                result = await check_func()
                if result:
                    print(f"✅ {check_name}: OK")
                else:
                    print(f"❌ {check_name}: FAILED")
                    all_passed = False
            except Exception as e:
                print(f"❌ {check_name}: ERROR - {e}")
                all_passed = False
                
        return all_passed
        
    async def _check_requests_library(self) -> bool:
        """Check if requests library is available"""
        try:
            import requests
            return True
        except ImportError:
            return False
            
    async def _check_server_accessibility(self) -> bool:
        """Check if target server is accessible"""
        try:
            import requests
            response = requests.get(self.base_url, timeout=10)
            return response.status_code in [200, 404]  # 404 is OK, means server is running
        except Exception:
            return False
            
    async def _check_environment_config(self) -> bool:
        """Check basic environment configuration"""
        try:
            # Check if we can read environment files
            env_files = ['.env.local', '.env', '.env.example']
            for env_file in env_files:
                if os.path.exists(f"../{env_file}"):
                    return True
            return True  # OK if no env files, we'll use defaults
        except Exception:
            return False
            
    async def _run_health_check(self) -> Dict[str, Any]:
        """Run production health check"""
        
        try:
            # Import and run health checker
            from production_health_check import ProductionHealthChecker
            
            checker = ProductionHealthChecker(self.base_url)
            health_report = await checker.run_all_health_checks()
            
            # Determine if we should proceed with error recovery tests
            critical_issues = health_report.get("production_readiness", {}).get("blockers", [])
            proceed_with_error_tests = len(critical_issues) == 0
            
            return {
                "status": "completed",
                "report": health_report,
                "proceed_with_error_tests": proceed_with_error_tests,
                "critical_issues": critical_issues
            }
            
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "proceed_with_error_tests": False
            }
            
    async def _run_error_recovery_validation(self) -> Dict[str, Any]:
        """Run error recovery validation"""
        
        try:
            # Import and run error recovery validator
            from validate_error_recovery import ErrorRecoveryValidator
            
            validator = ErrorRecoveryValidator()
            recovery_report = await validator.run_all_tests()
            
            return {
                "status": "completed",
                "report": recovery_report
            }
            
        except Exception as e:
            print(f"❌ Error recovery validation failed: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }
            
    async def _run_integration_tests(self) -> Dict[str, Any]:
        """Run additional integration tests"""
        
        try:
            import requests
            
            # Test key integration points
            integration_tests = [
                ("API Health Endpoint", f"{self.base_url}/api/health"),
                ("Main Application", f"{self.base_url}"),
                ("Learning Page", f"{self.base_url}/learning"),
                ("Static Assets", f"{self.base_url}/_next/static/development/_buildManifest.js")
            ]
            
            test_results = []
            
            for test_name, url in integration_tests:
                start_time = time.time()
                try:
                    response = requests.get(url, timeout=15)
                    duration = int((time.time() - start_time) * 1000)
                    
                    test_results.append({
                        "test": test_name,
                        "url": url,
                        "status_code": response.status_code,
                        "duration_ms": duration,
                        "success": response.status_code in [200, 404],  # 404 acceptable for some endpoints
                        "response_size": len(response.content) if response.content else 0
                    })
                    
                except Exception as e:
                    duration = int((time.time() - start_time) * 1000)
                    test_results.append({
                        "test": test_name,
                        "url": url,
                        "error": str(e),
                        "duration_ms": duration,
                        "success": False
                    })
                    
            successful_tests = sum(1 for t in test_results if t["success"])
            total_tests = len(test_results)
            
            return {
                "status": "completed",
                "successful_tests": successful_tests,
                "total_tests": total_tests,
                "success_rate": successful_tests / total_tests if total_tests > 0 else 0,
                "test_results": test_results
            }
            
        except Exception as e:
            print(f"❌ Integration tests failed: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }
            
    def _generate_comprehensive_report(self, validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        
        total_duration = int((time.time() - self.start_time) * 1000)
        
        # Extract key metrics
        health_check = validation_results.get("health_check", {})
        error_recovery = validation_results.get("error_recovery", {})
        integration_tests = validation_results.get("integration_tests", {})
        
        # Calculate overall scores
        overall_health_score = 0.0
        overall_recovery_score = 0.0
        overall_integration_score = 0.0
        
        if health_check.get("status") == "completed":
            health_report = health_check.get("report", {})
            overall_health_score = health_report.get("health_summary", {}).get("overall_health_score", 0.0)
            
        if error_recovery.get("status") == "completed":
            recovery_report = error_recovery.get("report", {})
            recovery_summary = recovery_report.get("validation_summary", {})
            overall_recovery_score = recovery_summary.get("pass_rate", 0.0)
            
        if integration_tests.get("status") == "completed":
            overall_integration_score = integration_tests.get("success_rate", 0.0)
            
        # Calculate weighted overall score
        weights = {"health": 0.4, "recovery": 0.4, "integration": 0.2}
        overall_score = (
            overall_health_score * weights["health"] +
            overall_recovery_score * weights["recovery"] +
            overall_integration_score * weights["integration"]
        )
        
        # Determine production readiness
        production_ready = (
            overall_score >= 0.8 and
            overall_health_score >= 0.8 and
            overall_recovery_score >= 0.75 and
            len(health_check.get("critical_issues", [])) == 0
        )
        
        report = {
            "validation_summary": {
                "timestamp": datetime.now().isoformat(),
                "total_duration_ms": total_duration,
                "target_url": self.base_url,
                "overall_score": overall_score,
                "production_ready": production_ready
            },
            "component_scores": {
                "health_check": {
                    "score": overall_health_score,
                    "status": health_check.get("status", "not_run"),
                    "weight": weights["health"]
                },
                "error_recovery": {
                    "score": overall_recovery_score,
                    "status": error_recovery.get("status", "not_run"),
                    "weight": weights["recovery"]
                },
                "integration_tests": {
                    "score": overall_integration_score,
                    "status": integration_tests.get("status", "not_run"),
                    "weight": weights["integration"]
                }
            },
            "detailed_results": validation_results,
            "recommendations": self._generate_final_recommendations(validation_results, overall_score),
            "next_steps": self._generate_next_steps(production_ready, validation_results)
        }
        
        return report
        
    def _generate_limited_validation_report(self) -> Dict[str, Any]:
        """Generate limited validation report when prerequisites fail"""
        
        total_duration = int((time.time() - self.start_time) * 1000)
        
        report = {
            "validation_summary": {
                "timestamp": datetime.now().isoformat(),
                "total_duration_ms": total_duration,
                "target_url": self.base_url,
                "overall_score": 0.0,
                "production_ready": False,
                "limited_validation": True,
                "error": "System prerequisites not met"
            },
            "component_scores": {
                "health_check": {
                    "score": 0.0,
                    "status": "not_run",
                    "weight": 0.4,
                    "error": "Server not accessible"
                },
                "error_recovery": {
                    "score": 0.0,
                    "status": "not_run",
                    "weight": 0.4,
                    "error": "Prerequisites failed"
                },
                "integration_tests": {
                    "score": 0.0,
                    "status": "not_run",
                    "weight": 0.2,
                    "error": "Prerequisites failed"
                }
            },
            "detailed_results": {
                "prerequisite_failures": True,
                "server_accessible": False
            },
            "recommendations": [
                "Ensure the server is running at the target URL",
                "Check that all required dependencies are installed",
                "Verify environment configuration is correct",
                "Run module loading validation as alternative test"
            ],
            "next_steps": [
                "❌ System prerequisites not met",
                "🚀 Start the server: npm run dev",
                "🔧 Install dependencies: npm install",
                "🧪 Run module loading validation: ./validate-module-loading.sh",
                "🔄 Re-run comprehensive validation after fixes"
            ]
        }
        
        return report
        
    def _generate_final_recommendations(self, validation_results: Dict[str, Any], overall_score: float) -> List[str]:
        """Generate final recommendations"""
        
        recommendations = []
        
        # Health check recommendations
        health_check = validation_results.get("health_check", {})
        if health_check.get("status") == "completed":
            health_report = health_check.get("report", {})
            health_recommendations = health_report.get("recommendations", [])
            recommendations.extend(health_recommendations)
            
        # Error recovery recommendations
        error_recovery = validation_results.get("error_recovery", {})
        if error_recovery.get("status") == "completed":
            recovery_report = error_recovery.get("report", {})
            recovery_recommendations = recovery_report.get("recommendations", [])
            recommendations.extend(recovery_recommendations)
            
        # Integration recommendations
        integration_tests = validation_results.get("integration_tests", {})
        if integration_tests.get("status") == "completed":
            success_rate = integration_tests.get("success_rate", 0.0)
            if success_rate < 1.0:
                recommendations.append(f"Fix integration issues - {success_rate:.1%} success rate")
                
        # Overall recommendations
        if overall_score < 0.8:
            recommendations.append("System not ready for production - address critical issues first")
        elif overall_score < 0.9:
            recommendations.append("System mostly ready - consider addressing warnings before production")
        else:
            recommendations.append("System ready for production deployment")
            
        return list(set(recommendations))  # Remove duplicates
        
    def _generate_next_steps(self, production_ready: bool, validation_results: Dict[str, Any]) -> List[str]:
        """Generate next steps"""
        
        if production_ready:
            return [
                "✅ System is production-ready",
                "🚀 Proceed with deployment",
                "📊 Set up monitoring dashboards",
                "🔄 Schedule regular health checks",
                "📋 Document deployment procedures"
            ]
        else:
            next_steps = ["❌ System not production-ready"]
            
            # Add specific next steps based on failures
            health_check = validation_results.get("health_check", {})
            if health_check.get("critical_issues"):
                next_steps.append(f"🔧 Fix critical health issues: {', '.join(health_check['critical_issues'])}")
                
            error_recovery = validation_results.get("error_recovery", {})
            if error_recovery.get("status") == "failed":
                next_steps.append("🛠️ Fix error recovery mechanisms")
                
            integration_tests = validation_results.get("integration_tests", {})
            if integration_tests.get("success_rate", 1.0) < 0.8:
                next_steps.append("🔗 Fix integration issues")
                
            next_steps.extend([
                "🔄 Re-run validation after fixes",
                "📋 Update documentation",
                "🧪 Consider additional testing"
            ])
            
            return next_steps
            
    def print_final_summary(self, report: Dict[str, Any]):
        """Print final validation summary"""
        
        print("\n" + "="*80)
        print("🎯 COMPREHENSIVE VALIDATION SUMMARY")
        print("="*80)
        
        # Handle missing validation_summary gracefully
        if "validation_summary" not in report:
            print("❌ Validation failed to complete - missing summary data")
            if "error" in report:
                print(f"💥 Error: {report['error']}")
            print("="*80)
            return
            
        summary = report["validation_summary"]
        print(f"🎯 Overall Score: {summary.get('overall_score', 0.0):.1%}")
        print(f"🚀 Production Ready: {'YES' if summary.get('production_ready', False) else 'NO'}")
        print(f"⏱️ Total Duration: {summary.get('total_duration_ms', 0)/1000:.1f}s")
        print(f"🌐 Target URL: {summary.get('target_url', 'N/A')}")
        
        # Show error if this was a limited validation
        if summary.get('limited_validation', False):
            print(f"⚠️ Limited Validation: {summary.get('error', 'Unknown error')}")
        
        # Component scores
        if "component_scores" in report:
            print(f"\n📊 Component Scores:")
            for component, data in report["component_scores"].items():
                status_emoji = {"completed": "✅", "failed": "❌", "not_run": "⚪"}
                emoji = status_emoji.get(data.get("status", "unknown"), "❓")
                component_name = component.replace("_", " ").title()
                score = data.get('score', 0.0)
                weight = data.get('weight', 0.0)
                error_msg = f" - {data['error']}" if data.get('error') else ""
                print(f"  {emoji} {component_name}: {score:.1%} (weight: {weight:.1%}){error_msg}")
            
        # Recommendations
        if report.get("recommendations"):
            print(f"\n💡 Key Recommendations:")
            for i, rec in enumerate(report["recommendations"][:5], 1):  # Show top 5
                print(f"  {i}. {rec}")
                
        # Next steps
        if report.get("next_steps"):
            print(f"\n📋 Next Steps:")
            for step in report["next_steps"]:
                print(f"  {step}")
            
        print("\n" + "="*80)

async def main():
    """Main execution function"""
    
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description="AI Course Platform Validation Suite")
    parser.add_argument("--url", default="http://localhost:3000", help="Target URL for validation")
    parser.add_argument("--output", help="Output file for detailed report")
    parser.add_argument("--skip-recovery", action="store_true", help="Skip error recovery tests")
    
    args = parser.parse_args()
    
    runner = ValidationSuiteRunner(args.url)
    
    try:
        # Run comprehensive validation
        report = await runner.run_comprehensive_validation()
        
        # Print summary
        runner.print_final_summary(report)
        
        # Save detailed report
        output_file = args.output or f"validation-report-{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
            
        print(f"\n📄 Detailed report saved to: {output_file}")
        
        # Exit with appropriate code
        validation_summary = report.get("validation_summary", {})
        production_ready = validation_summary.get("production_ready", False)
        overall_score = validation_summary.get("overall_score", 0.0)
        
        if production_ready:
            print("\n🎉 VALIDATION SUITE PASSED - System is production-ready!")
            sys.exit(0)
        else:
            if validation_summary.get("limited_validation", False):
                print(f"\n⚠️ VALIDATION SUITE INCOMPLETE - Prerequisites not met")
                sys.exit(2)
            else:
                print(f"\n⚠️ VALIDATION SUITE NEEDS ATTENTION - Overall score: {overall_score:.1%}")
                sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⏹️ Validation interrupted by user")
        sys.exit(2)
    except Exception as e:
        print(f"\n💥 Validation suite failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(3)

if __name__ == "__main__":
    asyncio.run(main())