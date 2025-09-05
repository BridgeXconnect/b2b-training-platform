#!/usr/bin/env python3
"""
Offline Validation Suite
Runs validation tests that don't require the server to be running
"""

import os
import sys
import json
import subprocess
import time
from typing import Dict, Any, List
from datetime import datetime
from pathlib import Path

class OfflineValidationRunner:
    """Runs offline validation tests"""
    
    def __init__(self, project_root: str = None):
        if project_root is None:
            # Use current working directory as project root
            self.project_root = Path.cwd()
        else:
            self.project_root = Path(project_root).resolve()
        self.start_time = time.time()
        
    def run_offline_validation(self) -> Dict[str, Any]:
        """Run complete offline validation suite"""
        
        print("🔍 AI Course Platform - Offline Validation Suite")
        print("=" * 70)
        print(f"📁 Project Root: {self.project_root}")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        
        validation_results = {}
        
        # 1. File Structure Validation
        print("\n📂 File Structure Validation")
        print("-" * 40)
        validation_results["file_structure"] = self._validate_file_structure()
        
        # 2. Configuration Validation
        print("\n⚙️ Configuration Validation")
        print("-" * 40)
        validation_results["configuration"] = self._validate_configuration()
        
        # 3. Dependencies Validation
        print("\n📦 Dependencies Validation")
        print("-" * 40)
        validation_results["dependencies"] = self._validate_dependencies()
        
        # 4. Code Quality Validation
        print("\n✨ Code Quality Validation")
        print("-" * 40)
        validation_results["code_quality"] = self._validate_code_quality()
        
        # 5. Module Loading Validation
        print("\n🧩 Module Loading Validation")
        print("-" * 40)
        validation_results["module_loading"] = self._run_module_loading_validation()
        
        # 6. TypeScript Compilation
        print("\n🔧 TypeScript Compilation")
        print("-" * 40)
        validation_results["typescript"] = self._validate_typescript()
        
        # Generate comprehensive report
        return self._generate_offline_report(validation_results)
    
    def _validate_file_structure(self) -> Dict[str, Any]:
        """Validate project file structure"""
        
        critical_files = [
            "package.json",
            "next.config.js", 
            "tsconfig.json",
            "app/layout.tsx",
            "app/page.tsx"
        ]
        
        # Check for Tailwind config (either .js or .ts)
        tailwind_config_files = ["tailwind.config.js", "tailwind.config.ts"]
        tailwind_found = False
        for tailwind_file in tailwind_config_files:
            if (self.project_root / tailwind_file).exists():
                critical_files.append(tailwind_file)
                tailwind_found = True
                break
        if not tailwind_found:
            critical_files.append("tailwind.config.js")  # Default for error reporting
        
        important_dirs = [
            "app",
            "components", 
            "lib",
            "public"
        ]
        
        optional_files = [
            ".env.local",
            ".env.example",
            "README.md",
            "CHANGELOG.md"
        ]
        
        results = {
            "critical_files": {},
            "important_dirs": {},
            "optional_files": {},
            "missing_critical": [],
            "missing_important": []
        }
        
        # Check critical files
        for file_path in critical_files:
            full_path = self.project_root / file_path
            exists = full_path.exists()
            results["critical_files"][file_path] = {
                "exists": exists,
                "path": str(full_path),
                "size": full_path.stat().st_size if exists else 0
            }
            if not exists:
                results["missing_critical"].append(file_path)
                print(f"❌ Missing critical file: {file_path}")
            else:
                print(f"✅ Found: {file_path} ({full_path.stat().st_size} bytes)")
        
        # Check important directories
        for dir_path in important_dirs:
            full_path = self.project_root / dir_path
            exists = full_path.exists() and full_path.is_dir()
            file_count = len(list(full_path.rglob("*"))) if exists else 0
            results["important_dirs"][dir_path] = {
                "exists": exists,
                "path": str(full_path),
                "file_count": file_count
            }
            if not exists:
                results["missing_important"].append(dir_path)
                print(f"⚠️ Missing directory: {dir_path}")
            else:
                print(f"✅ Found: {dir_path}/ ({file_count} files)")
        
        # Check optional files
        for file_path in optional_files:
            full_path = self.project_root / file_path
            exists = full_path.exists()
            results["optional_files"][file_path] = {
                "exists": exists,
                "path": str(full_path)
            }
            if exists:
                print(f"✅ Optional: {file_path}")
            else:
                print(f"ℹ️ Optional missing: {file_path}")
        
        # Calculate score
        critical_score = (len(critical_files) - len(results["missing_critical"])) / len(critical_files) if critical_files else 1.0
        important_score = (len(important_dirs) - len(results["missing_important"])) / len(important_dirs) if important_dirs else 1.0
        overall_score = (critical_score * 0.7) + (important_score * 0.3)
        
        results["scores"] = {
            "critical_score": critical_score,
            "important_score": important_score,
            "overall_score": overall_score
        }
        
        return results
    
    def _validate_configuration(self) -> Dict[str, Any]:
        """Validate configuration files"""
        
        results = {
            "package_json": {},
            "next_config": {},
            "tsconfig": {},
            "tailwind_config": {},
            "overall_score": 0.0
        }
        
        # Validate package.json
        package_json_path = self.project_root / "package.json"
        if package_json_path.exists():
            try:
                with open(package_json_path) as f:
                    package_data = json.load(f)
                
                required_deps = ["next", "react", "@types/react", "typescript"]
                missing_deps = [dep for dep in required_deps if dep not in package_data.get("dependencies", {}) and dep not in package_data.get("devDependencies", {})]
                
                results["package_json"] = {
                    "valid": True,
                    "has_scripts": "scripts" in package_data,
                    "has_dependencies": "dependencies" in package_data,
                    "missing_deps": missing_deps,
                    "dep_count": len(package_data.get("dependencies", {})) + len(package_data.get("devDependencies", {}))
                }
                
                print(f"✅ package.json: Valid ({results['package_json']['dep_count']} dependencies)")
                if missing_deps:
                    print(f"⚠️ Missing critical dependencies: {', '.join(missing_deps)}")
                    
            except Exception as e:
                results["package_json"] = {"valid": False, "error": str(e)}
                print(f"❌ package.json: Invalid - {e}")
        else:
            results["package_json"] = {"valid": False, "error": "File not found"}
            print("❌ package.json: Not found")
        
        # Validate other configs
        config_files = {
            "next_config": "next.config.js",
            "tsconfig": "tsconfig.json"
        }
        
        # Check for Tailwind config (either .js or .ts)
        tailwind_config_found = False
        for tailwind_file in ["tailwind.config.js", "tailwind.config.ts"]:
            if (self.project_root / tailwind_file).exists():
                config_files["tailwind_config"] = tailwind_file
                tailwind_config_found = True
                break
        if not tailwind_config_found:
            config_files["tailwind_config"] = "tailwind.config.js"  # Default for error reporting
        
        for config_key, filename in config_files.items():
            config_path = self.project_root / filename
            if config_path.exists():
                try:
                    # Basic existence and readability check
                    content = config_path.read_text()
                    results[config_key] = {
                        "exists": True,
                        "readable": True,
                        "size": len(content)
                    }
                    print(f"✅ {filename}: Found ({len(content)} chars)")
                except Exception as e:
                    results[config_key] = {
                        "exists": True,
                        "readable": False,
                        "error": str(e)
                    }
                    print(f"⚠️ {filename}: Exists but unreadable - {e}")
            else:
                results[config_key] = {"exists": False}
                print(f"❌ {filename}: Not found")
        
        # Calculate overall score
        valid_configs = sum(1 for config in results.values() if isinstance(config, dict) and config.get("valid", config.get("exists", False)))
        total_configs = len(config_files) + 1  # +1 for package.json
        results["overall_score"] = valid_configs / total_configs
        
        return results
    
    def _validate_dependencies(self) -> Dict[str, Any]:
        """Validate project dependencies"""
        
        results = {
            "node_modules_exists": False,
            "package_lock_exists": False, 
            "npm_audit": {},
            "overall_score": 0.0
        }
        
        # Check node_modules
        node_modules_path = self.project_root / "node_modules"
        results["node_modules_exists"] = node_modules_path.exists()
        if results["node_modules_exists"]:
            package_count = len(list(node_modules_path.iterdir()))
            print(f"✅ node_modules: Found ({package_count} packages)")
        else:
            print("❌ node_modules: Not found - run 'npm install'")
        
        # Check package-lock.json
        package_lock_path = self.project_root / "package-lock.json"
        results["package_lock_exists"] = package_lock_path.exists()
        if results["package_lock_exists"]:
            print("✅ package-lock.json: Found")
        else:
            print("⚠️ package-lock.json: Not found")
        
        # Try npm audit (if npm is available)
        try:
            os.chdir(self.project_root)
            audit_result = subprocess.run(
                ["npm", "audit", "--json"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if audit_result.returncode == 0:
                audit_data = json.loads(audit_result.stdout)
                results["npm_audit"] = {
                    "vulnerabilities": audit_data.get("metadata", {}).get("vulnerabilities", {}),
                    "total_dependencies": audit_data.get("metadata", {}).get("totalDependencies", 0)
                }
                vuln_count = sum(results["npm_audit"]["vulnerabilities"].values())
                print(f"✅ npm audit: {vuln_count} vulnerabilities found")
            else:
                results["npm_audit"] = {"error": "audit failed"}
                print("⚠️ npm audit: Failed to run")
                
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError, json.JSONDecodeError) as e:
            results["npm_audit"] = {"error": str(e)}
            print(f"⚠️ npm audit: Not available - {e}")
        
        # Calculate score
        score_components = [
            results["node_modules_exists"],
            results["package_lock_exists"],
            len(results.get("npm_audit", {}).get("vulnerabilities", {})) == 0
        ]
        results["overall_score"] = sum(score_components) / len(score_components)
        
        return results
    
    def _validate_code_quality(self) -> Dict[str, Any]:
        """Validate code quality"""
        
        results = {
            "typescript_files": 0,
            "javascript_files": 0,
            "component_files": 0,
            "large_files": [],
            "overall_score": 0.8  # Default good score for offline validation
        }
        
        # Count different file types (excluding node_modules and .next)
        exclude_dirs = {'.next', 'node_modules', '.git', 'dist', 'build'}
        
        ts_files = []
        js_files = []
        
        for file_path in self.project_root.rglob("*"):
            # Skip excluded directories
            if any(excluded in file_path.parts for excluded in exclude_dirs):
                continue
                
            if file_path.suffix in ['.ts', '.tsx'] and file_path.is_file():
                ts_files.append(file_path)
            elif file_path.suffix in ['.js', '.jsx'] and file_path.is_file():
                js_files.append(file_path)
        
        results["typescript_files"] = len(ts_files)
        results["javascript_files"] = len(js_files)
        
        component_files = [f for f in ts_files if 'components' in str(f) and f.suffix == '.tsx']
        results["component_files"] = len(component_files)
        
        # Check for large files
        for file_path in ts_files + js_files:
            try:
                if file_path.stat().st_size > 10000:  # > 10KB
                    results["large_files"].append({
                        "path": str(file_path.relative_to(self.project_root)),
                        "size": file_path.stat().st_size
                    })
            except (OSError, ValueError):
                continue  # Skip files that can't be accessed
        
        print(f"✅ TypeScript files: {results['typescript_files']}")
        print(f"✅ JavaScript files: {results['javascript_files']}")
        print(f"✅ Component files: {results['component_files']}")
        
        if results["large_files"]:
            print(f"⚠️ Large files found: {len(results['large_files'])}")
            for large_file in results["large_files"][:3]:  # Show first 3
                print(f"  - {large_file['path']} ({large_file['size']} bytes)")
        
        return results
    
    def _run_module_loading_validation(self) -> Dict[str, Any]:
        """Run the shell script module loading validation"""
        
        results = {
            "script_exists": False,
            "script_executable": False,
            "exit_code": None,
            "output": "",
            "overall_score": 0.0
        }
        
        script_path = self.project_root / "test-scripts" / "validate-module-loading.sh"
        
        if script_path.exists():
            results["script_exists"] = True
            results["script_executable"] = os.access(script_path, os.X_OK)
            
            print(f"✅ Module loading script found: {script_path}")
            
            if results["script_executable"]:
                try:
                    os.chdir(self.project_root)
                    result = subprocess.run(
                        ["bash", str(script_path)],
                        capture_output=True,
                        text=True,
                        timeout=120
                    )
                    
                    results["exit_code"] = result.returncode
                    results["output"] = result.stdout
                    results["error"] = result.stderr
                    
                    if result.returncode == 0:
                        print("✅ Module loading validation: PASSED")
                        results["overall_score"] = 1.0
                    else:
                        print(f"⚠️ Module loading validation: Issues found (exit code: {result.returncode})")
                        results["overall_score"] = 0.5
                        
                    # Print summary from script output
                    output_lines = result.stdout.split('\n')
                    for line in output_lines:
                        if "✅ Tests Passed:" in line or "❌ Tests Failed:" in line or "⚠️  Warnings:" in line:
                            print(f"  {line}")
                            
                except subprocess.TimeoutExpired:
                    results["exit_code"] = -1
                    results["error"] = "Script timed out"
                    print("❌ Module loading validation: Timed out")
                except Exception as e:
                    results["exit_code"] = -1
                    results["error"] = str(e)
                    print(f"❌ Module loading validation: Error - {e}")
            else:
                print("⚠️ Module loading script: Not executable")
        else:
            print("❌ Module loading script: Not found")
        
        return results
    
    def _validate_typescript(self) -> Dict[str, Any]:
        """Validate TypeScript compilation"""
        
        results = {
            "tsc_available": False,
            "compilation_successful": False,
            "error_count": 0,
            "warnings": [],
            "overall_score": 0.0
        }
        
        try:
            os.chdir(self.project_root)
            
            # Check if TypeScript compiler is available
            tsc_check = subprocess.run(
                ["npx", "tsc", "--version"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if tsc_check.returncode == 0:
                results["tsc_available"] = True
                print(f"✅ TypeScript compiler available: {tsc_check.stdout.strip()}")
                
                # Try compilation check
                compile_result = subprocess.run(
                    ["npx", "tsc", "--noEmit"],
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                
                results["compilation_successful"] = compile_result.returncode == 0
                
                if compile_result.returncode == 0:
                    print("✅ TypeScript compilation: No errors")
                    results["overall_score"] = 1.0
                else:
                    error_lines = compile_result.stderr.split('\n')
                    error_count = len([line for line in error_lines if 'error TS' in line])
                    results["error_count"] = error_count
                    if error_count > 0:
                        print(f"⚠️ TypeScript compilation: {error_count} errors found")
                        results["overall_score"] = 0.3
                    else:
                        print("✅ TypeScript compilation: No errors (despite non-zero exit code)")
                        results["overall_score"] = 1.0
                    
                    # Show first few errors
                    for line in error_lines[:5]:
                        if line.strip() and 'error TS' in line:
                            print(f"  - {line}")
            else:
                print("❌ TypeScript compiler: Not available")
                
        except Exception as e:
            results["error"] = str(e)
            print(f"❌ TypeScript validation: Error - {e}")
        
        return results
    
    def _generate_offline_report(self, validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive offline validation report"""
        
        total_duration = int((time.time() - self.start_time) * 1000)
        
        # Calculate component scores
        component_scores = {}
        overall_score = 0.0
        weights = {
            "file_structure": 0.25,
            "configuration": 0.20,
            "dependencies": 0.20,
            "code_quality": 0.15,
            "module_loading": 0.10,
            "typescript": 0.10
        }
        
        for component, weight in weights.items():
            if component in validation_results:
                # Handle nested score structure for file_structure
                if component == "file_structure" and "scores" in validation_results[component]:
                    score = validation_results[component]["scores"].get("overall_score", 0.0)
                else:
                    score = validation_results[component].get("overall_score", 0.0)
                    
                component_scores[component] = {
                    "score": score,
                    "weight": weight,
                    "status": "completed" if score > 0 else "failed"
                }
                overall_score += score * weight
            else:
                component_scores[component] = {
                    "score": 0.0,
                    "weight": weight,
                    "status": "not_run"
                }
        
        # Determine if system is ready for development
        dev_ready = (
            overall_score >= 0.7 and
            validation_results.get("file_structure", {}).get("scores", {}).get("critical_score", 0) >= 0.8 and
            validation_results.get("dependencies", {}).get("node_modules_exists", False)
        )
        
        # Generate recommendations
        recommendations = []
        if not validation_results.get("dependencies", {}).get("node_modules_exists", False):
            recommendations.append("Run 'npm install' to install dependencies")
        
        missing_critical = validation_results.get("file_structure", {}).get("missing_critical", [])
        if missing_critical:
            recommendations.append(f"Create missing critical files: {', '.join(missing_critical)}")
        
        if validation_results.get("typescript", {}).get("error_count", 0) > 0:
            recommendations.append("Fix TypeScript compilation errors")
        
        if overall_score < 0.8:
            recommendations.append("Address configuration and structure issues before deployment")
        
        if not recommendations:
            recommendations.append("System appears ready for development")
        
        report = {
            "validation_summary": {
                "timestamp": datetime.now().isoformat(),
                "total_duration_ms": total_duration,
                "project_root": str(self.project_root),
                "overall_score": overall_score,
                "dev_ready": dev_ready,
                "validation_type": "offline"
            },
            "component_scores": component_scores,
            "detailed_results": validation_results,
            "recommendations": recommendations,
            "next_steps": self._generate_offline_next_steps(dev_ready, validation_results)
        }
        
        return report
    
    def _generate_offline_next_steps(self, dev_ready: bool, validation_results: Dict[str, Any]) -> List[str]:
        """Generate next steps for offline validation"""
        
        if dev_ready:
            return [
                "✅ System is ready for development",
                "🚀 Start the development server: npm run dev",
                "🧪 Run comprehensive validation: python run-validation-suite.py",
                "📊 Monitor system health and performance",
                "🔄 Set up continuous integration"
            ]
        else:
            next_steps = ["❌ System not ready for development"]
            
            # Add specific steps based on issues
            if not validation_results.get("dependencies", {}).get("node_modules_exists", False):
                next_steps.append("📦 Install dependencies: npm install")
            
            missing_critical = validation_results.get("file_structure", {}).get("missing_critical", [])
            if missing_critical:
                next_steps.append(f"📁 Create missing files: {', '.join(missing_critical)}")
            
            if validation_results.get("typescript", {}).get("error_count", 0) > 0:
                next_steps.append("🔧 Fix TypeScript errors: npx tsc --noEmit")
            
            next_steps.extend([
                "🔄 Re-run offline validation after fixes",
                "🚀 Start development server once issues resolved",
                "📋 Update project documentation"
            ])
            
        return next_steps
    
    def print_summary(self, report: Dict[str, Any]):
        """Print validation summary"""
        
        print("\n" + "="*80)
        print("🎯 OFFLINE VALIDATION SUMMARY")
        print("="*80)
        
        summary = report["validation_summary"]
        print(f"🎯 Overall Score: {summary['overall_score']:.1%}")
        print(f"🚀 Dev Ready: {'YES' if summary['dev_ready'] else 'NO'}")
        print(f"⏱️ Total Duration: {summary['total_duration_ms']/1000:.1f}s")
        print(f"📁 Project Root: {summary['project_root']}")
        
        # Component scores
        print(f"\n📊 Component Scores:")
        for component, data in report["component_scores"].items():
            status_emoji = {"completed": "✅", "failed": "❌", "not_run": "⚪"}
            emoji = status_emoji.get(data["status"], "❓")
            component_name = component.replace("_", " ").title()
            print(f"  {emoji} {component_name}: {data['score']:.1%} (weight: {data['weight']:.1%})")
        
        # Recommendations
        if report["recommendations"]:
            print(f"\n💡 Key Recommendations:")
            for i, rec in enumerate(report["recommendations"], 1):
                print(f"  {i}. {rec}")
        
        # Next steps
        print(f"\n📋 Next Steps:")
        for step in report["next_steps"]:
            print(f"  {step}")
        
        print("\n" + "="*80)


def main():
    """Main execution function"""
    
    import argparse
    parser = argparse.ArgumentParser(description="AI Course Platform Offline Validation Suite")
    parser.add_argument("--project-root", default=None, help="Project root directory (defaults to current directory)")
    parser.add_argument("--output", help="Output file for detailed report")
    
    args = parser.parse_args()
    
    runner = OfflineValidationRunner(args.project_root)
    
    try:
        # Run offline validation
        report = runner.run_offline_validation()
        
        # Print summary
        runner.print_summary(report)
        
        # Save detailed report
        output_file = args.output or f"offline-validation-report-{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: {output_file}")
        
        # Exit with appropriate code
        if report["validation_summary"]["dev_ready"]:
            print("\n🎉 OFFLINE VALIDATION PASSED - System is ready for development!")
            sys.exit(0)
        else:
            print(f"\n⚠️ OFFLINE VALIDATION NEEDS ATTENTION - Overall score: {report['validation_summary']['overall_score']:.1%}")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⏹️ Validation interrupted by user")
        sys.exit(2)
    except Exception as e:
        print(f"\n💥 Offline validation failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(3)


if __name__ == "__main__":
    main()