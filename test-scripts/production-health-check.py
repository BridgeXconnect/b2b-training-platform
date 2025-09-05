#!/usr/bin/env python3
"""
Production Health Check System
Validates production-ready configuration and monitors system health
"""

import asyncio
import json
import time
import os
import sys
import requests
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum

class HealthStatus(Enum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"

@dataclass
class HealthCheck:
    component: str
    status: HealthStatus
    response_time_ms: int
    details: Dict[str, Any]
    message: str
    timestamp: str

class ProductionHealthChecker:
    """Production environment health validation"""
    
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.checks: List[HealthCheck] = []
        self.start_time = time.time()
        
        # Load configuration
        self.load_environment()
        
    def load_environment(self):
        """Load environment configuration"""
        try:
            with open('../.env.local', 'r') as f:
                for line in f:
                    if '=' in line and not line.startswith('#'):
                        key, value = line.strip().split('=', 1)
                        os.environ[key] = value
        except FileNotFoundError:
            print("⚠️ No .env.local file found")
            
        self.openai_api_key = os.getenv('OPENAI_API_KEY', '')
        self.sentry_dsn = os.getenv('NEXT_PUBLIC_SENTRY_DSN', '')
        
    async def run_all_health_checks(self) -> Dict[str, Any]:
        """Run comprehensive health checks"""
        print("🔍 Production Health Check System")
        print("=" * 50)
        
        health_checks = [
            ("Environment Configuration", self.check_environment_config),
            ("API Endpoints Health", self.check_api_health),
            ("OpenAI Integration", self.check_openai_integration),
            ("Sentry Monitoring", self.check_sentry_monitoring),
            ("Database Connectivity", self.check_database_health),
            ("Frontend Assets", self.check_frontend_assets),
            ("Performance Metrics", self.check_performance_metrics),
            ("Security Headers", self.check_security_headers)
        ]
        
        for check_name, check_func in health_checks:
            print(f"\n🔬 {check_name}")
            print("-" * 30)
            
            try:
                await check_func()
            except Exception as e:
                self.checks.append(HealthCheck(
                    component=check_name,
                    status=HealthStatus.CRITICAL,
                    response_time_ms=0,
                    details={"error": str(e)},
                    message=f"Health check failed: {e}",
                    timestamp=datetime.now().isoformat()
                ))
                print(f"❌ {check_name} failed: {e}")
                
        return self.generate_health_report()
        
    async def check_environment_config(self):
        """Check environment configuration"""
        start_time = time.time()
        
        config_checks = {
            "OPENAI_API_KEY": self.openai_api_key,
            "SENTRY_DSN": self.sentry_dsn,
            "NODE_ENV": os.getenv('NODE_ENV', 'development')
        }
        
        missing_configs = [key for key, value in config_checks.items() if not value]
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        if not missing_configs:
            status = HealthStatus.HEALTHY
            message = "All required environment variables configured"
        elif len(missing_configs) == 1 and "SENTRY" in missing_configs[0]:
            status = HealthStatus.WARNING
            message = f"Optional configuration missing: {', '.join(missing_configs)}"
        else:
            status = HealthStatus.CRITICAL
            message = f"Critical configuration missing: {', '.join(missing_configs)}"
            
        self.checks.append(HealthCheck(
            component="Environment Configuration",
            status=status,
            response_time_ms=duration_ms,
            details={
                "configured": [k for k, v in config_checks.items() if v],
                "missing": missing_configs,
                "environment": os.getenv('NODE_ENV', 'unknown')
            },
            message=message,
            timestamp=datetime.now().isoformat()
        ))
        
        print(f"✅ Environment config: {message}")
        
    async def check_api_health(self):
        """Check API endpoints health"""
        
        endpoints = [
            "/api/health",
            "/api/chat",
            "/api/voice/exercise/generate"
        ]
        
        for endpoint in endpoints:
            await self._check_single_endpoint(endpoint)
            
    async def _check_single_endpoint(self, endpoint: str):
        """Check a single API endpoint"""
        start_time = time.time()
        
        try:
            if endpoint == "/api/health":
                response = requests.get(f"{self.api_base}/health", timeout=10)
            elif endpoint == "/api/chat":
                response = requests.post(
                    f"{self.api_base}/chat",
                    json={"message": "health check", "context": "test"},
                    timeout=15
                )
            elif endpoint == "/api/voice/exercise/generate":
                response = requests.post(
                    f"{self.api_base}/voice/exercise/generate",
                    json={
                        "type": "pronunciation-drill",
                        "cefrLevel": "B1",
                        "businessContext": "test"
                    },
                    timeout=20
                )
            else:
                response = requests.get(f"{self.api_base}{endpoint}", timeout=10)
                
            duration_ms = int((time.time() - start_time) * 1000)
            
            if response.status_code == 200:
                status = HealthStatus.HEALTHY if duration_ms < 2000 else HealthStatus.WARNING
                message = f"Endpoint responsive ({duration_ms}ms)"
            elif response.status_code == 404:
                status = HealthStatus.WARNING
                message = "Endpoint not found (may not be implemented)"
            else:
                status = HealthStatus.CRITICAL
                message = f"HTTP {response.status_code}: {response.text[:100]}"
                
        except requests.exceptions.Timeout:
            duration_ms = int((time.time() - start_time) * 1000)
            status = HealthStatus.CRITICAL
            message = f"Endpoint timeout after {duration_ms}ms"
        except requests.exceptions.ConnectionError:
            duration_ms = int((time.time() - start_time) * 1000)
            status = HealthStatus.CRITICAL
            message = "Connection error - service may be down"
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            status = HealthStatus.CRITICAL
            message = f"Unexpected error: {str(e)}"
            
        self.checks.append(HealthCheck(
            component=f"API Endpoint {endpoint}",
            status=status,
            response_time_ms=duration_ms,
            details={
                "endpoint": endpoint,
                "method": "GET" if endpoint == "/api/health" else "POST",
                "response_time_category": "fast" if duration_ms < 1000 else "slow" if duration_ms < 3000 else "very_slow"
            },
            message=message,
            timestamp=datetime.now().isoformat()
        ))
        
        status_emoji = {"healthy": "✅", "warning": "⚠️", "critical": "❌", "unknown": "❓"}[status.value]
        print(f"{status_emoji} {endpoint}: {message}")
        
    async def check_openai_integration(self):
        """Check OpenAI integration health"""
        start_time = time.time()
        
        if not self.openai_api_key:
            self.checks.append(HealthCheck(
                component="OpenAI Integration",
                status=HealthStatus.CRITICAL,
                response_time_ms=0,
                details={"error": "No API key configured"},
                message="OpenAI API key not configured",
                timestamp=datetime.now().isoformat()
            ))
            print("❌ OpenAI: API key not configured")
            return
            
        try:
            # Test OpenAI integration through our API
            response = requests.post(
                f"{self.api_base}/voice/exercise/generate",
                json={
                    "type": "pronunciation-drill",
                    "cefrLevel": "A1",
                    "businessContext": "health-check"
                },
                timeout=30
            )
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            if response.status_code == 200:
                data = response.json()
                if "exercise" in data and data["exercise"].get("title"):
                    status = HealthStatus.HEALTHY
                    message = "OpenAI integration working correctly"
                else:
                    status = HealthStatus.WARNING
                    message = "OpenAI fallback mechanism activated"
            else:
                status = HealthStatus.CRITICAL
                message = f"OpenAI integration failed: HTTP {response.status_code}"
                
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            status = HealthStatus.CRITICAL
            message = f"OpenAI integration error: {str(e)}"
            
        self.checks.append(HealthCheck(
            component="OpenAI Integration",
            status=status,
            response_time_ms=duration_ms,
            details={
                "api_key_configured": bool(self.openai_api_key),
                "integration_type": "voice_exercise_generation",
                "fallback_available": True
            },
            message=message,
            timestamp=datetime.now().isoformat()
        ))
        
        status_emoji = {"healthy": "✅", "warning": "⚠️", "critical": "❌"}[status.value]
        print(f"{status_emoji} OpenAI Integration: {message}")
        
    async def check_sentry_monitoring(self):
        """Check Sentry monitoring health"""
        start_time = time.time()
        
        if not self.sentry_dsn:
            self.checks.append(HealthCheck(
                component="Sentry Monitoring",
                status=HealthStatus.WARNING,
                response_time_ms=0,
                details={"configured": False},
                message="Sentry DSN not configured (monitoring disabled)",
                timestamp=datetime.now().isoformat()
            ))
            print("⚠️ Sentry: DSN not configured")
            return
            
        try:
            # Test Sentry integration service
            response = requests.get(f"{self.api_base}/sentry/health", timeout=10)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("connected"):
                    status = HealthStatus.HEALTHY
                    message = "Sentry monitoring active and connected"
                else:
                    status = HealthStatus.WARNING  
                    message = "Sentry configured but connection issues"
            else:
                status = HealthStatus.WARNING
                message = "Sentry health check endpoint not available"
                
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            status = HealthStatus.WARNING
            message = f"Sentry check failed: {str(e)}"
            
        self.checks.append(HealthCheck(
            component="Sentry Monitoring",
            status=status,
            response_time_ms=duration_ms,
            details={
                "dsn_configured": bool(self.sentry_dsn),
                "monitoring_type": "error_tracking_performance"
            },
            message=message,
            timestamp=datetime.now().isoformat()
        ))
        
        status_emoji = {"healthy": "✅", "warning": "⚠️", "critical": "❌"}[status.value]
        print(f"{status_emoji} Sentry Monitoring: {message}")
        
    async def check_database_health(self):
        """Check database connectivity"""
        start_time = time.time()
        
        try:
            # Test database through API endpoint
            response = requests.get(f"{self.api_base}/health", timeout=10)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            if response.status_code == 200:
                status = HealthStatus.HEALTHY
                message = "Database connectivity appears healthy"
            else:
                status = HealthStatus.WARNING
                message = "Unable to verify database connectivity"
                
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            status = HealthStatus.WARNING
            message = f"Database health check failed: {str(e)}"
            
        self.checks.append(HealthCheck(
            component="Database Connectivity",
            status=status,
            response_time_ms=duration_ms,
            details={
                "connection_method": "api_proxy",
                "database_type": "supabase"
            },
            message=message,
            timestamp=datetime.now().isoformat()
        ))
        
        status_emoji = {"healthy": "✅", "warning": "⚠️", "critical": "❌"}[status.value]
        print(f"{status_emoji} Database: {message}")
        
    async def check_frontend_assets(self):
        """Check frontend assets availability"""
        start_time = time.time()
        
        assets_to_check = [
            "/",
            "/learning",
            "/_next/static/development/_buildManifest.js"
        ]
        
        asset_results = []
        
        for asset in assets_to_check:
            asset_start = time.time()
            try:
                response = requests.get(f"{self.base_url}{asset}", timeout=10)
                asset_duration = int((time.time() - asset_start) * 1000)
                
                asset_results.append({
                    "asset": asset,
                    "status_code": response.status_code,
                    "duration_ms": asset_duration,
                    "size_bytes": len(response.content) if response.content else 0
                })
                
            except Exception as e:
                asset_duration = int((time.time() - asset_start) * 1000)
                asset_results.append({
                    "asset": asset,
                    "error": str(e),
                    "duration_ms": asset_duration
                })
                
        duration_ms = int((time.time() - start_time) * 1000)
        
        successful_assets = sum(1 for r in asset_results if r.get("status_code") == 200)
        total_assets = len(asset_results)
        
        if successful_assets == total_assets:
            status = HealthStatus.HEALTHY
            message = f"All {total_assets} frontend assets accessible"
        elif successful_assets > total_assets * 0.5:
            status = HealthStatus.WARNING  
            message = f"{successful_assets}/{total_assets} frontend assets accessible"
        else:
            status = HealthStatus.CRITICAL
            message = f"Only {successful_assets}/{total_assets} frontend assets accessible"
            
        self.checks.append(HealthCheck(
            component="Frontend Assets",
            status=status,
            response_time_ms=duration_ms,
            details={
                "assets_checked": asset_results,
                "successful_assets": successful_assets,
                "total_assets": total_assets
            },
            message=message,
            timestamp=datetime.now().isoformat()
        ))
        
        status_emoji = {"healthy": "✅", "warning": "⚠️", "critical": "❌"}[status.value]
        print(f"{status_emoji} Frontend Assets: {message}")
        
    async def check_performance_metrics(self):
        """Check system performance metrics"""
        start_time = time.time()
        
        # Test multiple endpoints for performance
        performance_tests = [
            {"endpoint": "/api/health", "expected_max_ms": 500},
            {"endpoint": "/", "expected_max_ms": 2000},
            {"endpoint": "/learning", "expected_max_ms": 3000}
        ]
        
        performance_results = []
        
        for test in performance_tests:
            test_start = time.time()
            try:
                if test["endpoint"].startswith("/api/"):
                    response = requests.get(f"{self.api_base}{test['endpoint'].replace('/api', '')}", timeout=10)
                else:
                    response = requests.get(f"{self.base_url}{test['endpoint']}", timeout=10)
                    
                test_duration = int((time.time() - test_start) * 1000)
                
                performance_results.append({
                    "endpoint": test["endpoint"],
                    "duration_ms": test_duration,
                    "expected_max_ms": test["expected_max_ms"],
                    "meets_target": test_duration <= test["expected_max_ms"],
                    "status_code": response.status_code
                })
                
            except Exception as e:
                test_duration = int((time.time() - test_start) * 1000)
                performance_results.append({
                    "endpoint": test["endpoint"],
                    "duration_ms": test_duration,
                    "expected_max_ms": test["expected_max_ms"],
                    "meets_target": False,
                    "error": str(e)
                })
                
        duration_ms = int((time.time() - start_time) * 1000)
        
        targets_met = sum(1 for r in performance_results if r.get("meets_target", False))
        total_tests = len(performance_results)
        
        if targets_met == total_tests:
            status = HealthStatus.HEALTHY
            message = f"All performance targets met ({targets_met}/{total_tests})"
        elif targets_met >= total_tests * 0.7:
            status = HealthStatus.WARNING
            message = f"Most performance targets met ({targets_met}/{total_tests})"
        else:
            status = HealthStatus.CRITICAL
            message = f"Performance targets not met ({targets_met}/{total_tests})"
            
        self.checks.append(HealthCheck(
            component="Performance Metrics",
            status=status,
            response_time_ms=duration_ms,
            details={
                "performance_tests": performance_results,
                "targets_met": targets_met,
                "total_tests": total_tests,
                "avg_response_time_ms": sum(r.get("duration_ms", 0) for r in performance_results) / total_tests
            },
            message=message,
            timestamp=datetime.now().isoformat()
        ))
        
        status_emoji = {"healthy": "✅", "warning": "⚠️", "critical": "❌"}[status.value]
        print(f"{status_emoji} Performance: {message}")
        
    async def check_security_headers(self):
        """Check security headers"""
        start_time = time.time()
        
        try:
            response = requests.get(self.base_url, timeout=10)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            security_headers = {
                "x-frame-options": response.headers.get("x-frame-options"),
                "x-content-type-options": response.headers.get("x-content-type-options"),
                "x-xss-protection": response.headers.get("x-xss-protection"),
                "strict-transport-security": response.headers.get("strict-transport-security"),
                "content-security-policy": response.headers.get("content-security-policy")
            }
            
            present_headers = sum(1 for v in security_headers.values() if v)
            total_headers = len(security_headers)
            
            if present_headers >= 3:
                status = HealthStatus.HEALTHY
                message = f"Good security headers coverage ({present_headers}/{total_headers})"
            elif present_headers >= 1:
                status = HealthStatus.WARNING
                message = f"Basic security headers present ({present_headers}/{total_headers})"
            else:
                status = HealthStatus.WARNING
                message = "No security headers detected"
                
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            status = HealthStatus.WARNING
            message = f"Security headers check failed: {str(e)}"
            security_headers = {}
            
        self.checks.append(HealthCheck(
            component="Security Headers",
            status=status,
            response_time_ms=duration_ms,
            details={
                "headers_present": {k: bool(v) for k, v in security_headers.items()},
                "total_checked": len(security_headers)
            },
            message=message,
            timestamp=datetime.now().isoformat()
        ))
        
        status_emoji = {"healthy": "✅", "warning": "⚠️", "critical": "❌"}[status.value]
        print(f"{status_emoji} Security Headers: {message}")
        
    def generate_health_report(self) -> Dict[str, Any]:
        """Generate comprehensive health report"""
        
        total_duration = int((time.time() - self.start_time) * 1000)
        
        # Categorize results
        healthy = [c for c in self.checks if c.status == HealthStatus.HEALTHY]
        warning = [c for c in self.checks if c.status == HealthStatus.WARNING]
        critical = [c for c in self.checks if c.status == HealthStatus.CRITICAL]
        
        # Calculate overall health score
        health_score = self._calculate_health_score()
        
        report = {
            "health_summary": {
                "timestamp": datetime.now().isoformat(),
                "total_duration_ms": total_duration,
                "total_checks": len(self.checks),
                "healthy": len(healthy),
                "warning": len(warning),
                "critical": len(critical),
                "overall_health_score": health_score,
                "system_status": self._determine_system_status(health_score)
            },
            "health_checks": [asdict(check) for check in self.checks],
            "component_health": {
                "api_endpoints": self._get_component_health("API Endpoint"),
                "integrations": self._get_component_health("Integration", "OpenAI", "Sentry"),
                "infrastructure": self._get_component_health("Database", "Frontend", "Performance"),
                "security": self._get_component_health("Security")
            },
            "recommendations": self._generate_health_recommendations(),
            "production_readiness": {
                "ready_for_production": health_score >= 0.8 and len(critical) == 0,
                "blockers": [c.component for c in critical],
                "warnings": [c.component for c in warning]
            }
        }
        
        return report
        
    def _calculate_health_score(self) -> float:
        """Calculate overall health score"""
        if not self.checks:
            return 0.0
            
        weights = {
            HealthStatus.HEALTHY: 1.0,
            HealthStatus.WARNING: 0.5,
            HealthStatus.CRITICAL: 0.0
        }
        
        total_score = sum(weights[check.status] for check in self.checks)
        max_score = len(self.checks)
        
        return total_score / max_score if max_score > 0 else 0.0
        
    def _determine_system_status(self, health_score: float) -> str:
        """Determine overall system status"""
        if health_score >= 0.9:
            return "excellent"
        elif health_score >= 0.8:
            return "good"
        elif health_score >= 0.6:
            return "fair"
        elif health_score >= 0.4:
            return "poor"
        else:
            return "critical"
            
    def _get_component_health(self, *keywords) -> Dict[str, Any]:
        """Get health status for component category"""
        
        category_checks = [
            c for c in self.checks
            if any(keyword.lower() in c.component.lower() for keyword in keywords)
        ]
        
        if not category_checks:
            return {"status": "not_checked", "checks": 0}
            
        healthy = sum(1 for c in category_checks if c.status == HealthStatus.HEALTHY)
        warning = sum(1 for c in category_checks if c.status == HealthStatus.WARNING)
        critical = sum(1 for c in category_checks if c.status == HealthStatus.CRITICAL)
        
        if critical > 0:
            status = "critical"
        elif warning > healthy:
            status = "warning"
        elif healthy > 0:
            status = "healthy"
        else:
            status = "unknown"
            
        return {
            "status": status,
            "healthy": healthy,
            "warning": warning,
            "critical": critical,
            "total_checks": len(category_checks),
            "avg_response_time_ms": sum(c.response_time_ms for c in category_checks) / len(category_checks)
        }
        
    def _generate_health_recommendations(self) -> List[str]:
        """Generate health recommendations"""
        
        recommendations = []
        
        # Check for critical issues
        critical_checks = [c for c in self.checks if c.status == HealthStatus.CRITICAL]
        if critical_checks:
            recommendations.append(f"Address {len(critical_checks)} critical issues before production deployment")
            
        # Check environment configuration
        env_checks = [c for c in self.checks if "environment" in c.component.lower()]
        if any(c.status in [HealthStatus.CRITICAL, HealthStatus.WARNING] for c in env_checks):
            recommendations.append("Review and complete environment configuration")
            
        # Check performance
        perf_checks = [c for c in self.checks if "performance" in c.component.lower()]
        if any(c.status == HealthStatus.WARNING for c in perf_checks):
            recommendations.append("Optimize performance for better user experience")
            
        # Check security
        security_checks = [c for c in self.checks if "security" in c.component.lower()]
        if any(c.status == HealthStatus.WARNING for c in security_checks):
            recommendations.append("Enhance security headers and configurations")
            
        if not recommendations:
            recommendations.append("System health is good. Continue monitoring in production.")
            
        return recommendations
        
    def print_health_summary(self, report: Dict[str, Any]):
        """Print formatted health summary"""
        
        print("\n" + "="*60)
        print("🏥 PRODUCTION HEALTH CHECK SUMMARY")
        print("="*60)
        
        summary = report["health_summary"]
        print(f"🎯 Overall Health Score: {summary['overall_health_score']:.1%}")
        print(f"📊 System Status: {summary['system_status'].upper()}")
        print(f"✅ Healthy: {summary['healthy']} | ⚠️ Warning: {summary['warning']} | ❌ Critical: {summary['critical']}")
        print(f"⏱️ Total Check Time: {summary['total_duration_ms']/1000:.1f}s")
        
        # Production readiness
        readiness = report["production_readiness"]
        ready_emoji = "✅" if readiness["ready_for_production"] else "❌"
        print(f"\n{ready_emoji} Production Ready: {readiness['ready_for_production']}")
        
        if readiness["blockers"]:
            print(f"🚫 Blockers: {', '.join(readiness['blockers'])}")
        if readiness["warnings"]:
            print(f"⚠️ Warnings: {', '.join(readiness['warnings'])}")
            
        # Component health
        print(f"\n📋 Component Health:")
        for category, health in report["component_health"].items():
            status_emoji = {
                "healthy": "🟢",
                "warning": "🟡",
                "critical": "🔴",
                "not_checked": "⚪"
            }.get(health["status"], "❓")
            
            print(f"  {status_emoji} {category.replace('_', ' ').title()}: {health['status']}")
            
        # Recommendations
        if report["recommendations"]:
            print(f"\n💡 Recommendations:")
            for i, rec in enumerate(report["recommendations"], 1):
                print(f"  {i}. {rec}")
                
        print("\n" + "="*60)

async def main():
    """Main execution function"""
    
    checker = ProductionHealthChecker()
    
    try:
        report = await checker.run_all_health_checks()
        
        # Print summary
        checker.print_health_summary(report)
        
        # Save detailed report
        report_filename = f"production-health-check-{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w') as f:
            json.dump(report, f, indent=2)
            
        print(f"\n📄 Detailed report saved to: {report_filename}")
        
        # Exit with appropriate code
        if report["production_readiness"]["ready_for_production"]:
            print("✅ Production health check PASSED")
            sys.exit(0)
        else:
            print("❌ Production health check FAILED")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⏹️ Health check interrupted by user")
        sys.exit(2)
    except Exception as e:
        print(f"\n💥 Health check failed with error: {e}")
        sys.exit(3)

if __name__ == "__main__":
    asyncio.run(main())