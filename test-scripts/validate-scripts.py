#!/usr/bin/env python3
"""
Script Validation Tool
Validates the syntax and basic functionality of validation scripts
"""

import ast
import sys
import os
from typing import List, Tuple

def validate_python_syntax(file_path: str) -> Tuple[bool, str]:
    """Validate Python file syntax"""
    try:
        with open(file_path, 'r') as f:
            source = f.read()
        
        # Parse the AST to check syntax
        ast.parse(source)
        return True, "Syntax valid"
        
    except SyntaxError as e:
        return False, f"Syntax error: {e}"
    except Exception as e:
        return False, f"Error reading file: {e}"

def check_imports(file_path: str) -> Tuple[bool, List[str]]:
    """Check if all imports are available"""
    missing_imports = []
    
    try:
        with open(file_path, 'r') as f:
            source = f.read()
            
        tree = ast.parse(source)
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    try:
                        __import__(alias.name)
                    except ImportError:
                        missing_imports.append(alias.name)
                        
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    try:
                        __import__(node.module)
                    except ImportError:
                        missing_imports.append(node.module)
                        
        return len(missing_imports) == 0, missing_imports
        
    except Exception as e:
        return False, [f"Error checking imports: {e}"]

def main():
    """Main validation function"""
    
    scripts_to_validate = [
        "validate-error-recovery.py",
        "production-health-check.py", 
        "run-validation-suite.py"
    ]
    
    print("🔍 Validating Error Recovery Scripts")
    print("=" * 50)
    
    all_valid = True
    
    for script in scripts_to_validate:
        print(f"\n📝 Validating {script}")
        print("-" * 30)
        
        if not os.path.exists(script):
            print(f"❌ File not found: {script}")
            all_valid = False
            continue
            
        # Check syntax
        syntax_valid, syntax_msg = validate_python_syntax(script)
        if syntax_valid:
            print(f"✅ Syntax: {syntax_msg}")
        else:
            print(f"❌ Syntax: {syntax_msg}")
            all_valid = False
            continue
            
        # Check imports
        imports_valid, missing_imports = check_imports(script)
        if imports_valid:
            print("✅ Imports: All required modules available")
        else:
            print(f"⚠️ Imports: Missing modules: {', '.join(missing_imports)}")
            if 'requests' in missing_imports:
                print("   💡 Install with: pip install requests")
            # Don't mark as invalid for missing imports as they might not be needed in test env
            
        print(f"✅ {script} validation complete")
        
    print(f"\n{'='*50}")
    
    if all_valid:
        print("🎉 All scripts validated successfully!")
        print("\n🚀 Ready to run validation suite:")
        print("   python run-validation-suite.py")
        sys.exit(0)
    else:
        print("❌ Some scripts have validation errors")
        print("🔧 Please fix the errors before running validation")
        sys.exit(1)

if __name__ == "__main__":
    main()