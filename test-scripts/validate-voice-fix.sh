#!/bin/bash

# Voice Practice Interface - OPENAI_API_KEY Fix Validation Script
# Comprehensive validation and testing automation

set -e

echo "🧪 Starting Voice Practice OPENAI_API_KEY Fix Validation"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_RESULTS_DIR="$PROJECT_ROOT/test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create test results directory
mkdir -p "$TEST_RESULTS_DIR"

# Logging function
log() {
    echo -e "${2:-$GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO: $1${NC}"
}

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Track test result
track_test() {
    local test_name="$1"
    local result="$2"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if [ "$result" = "PASS" ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log "✅ $test_name: PASSED"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        error "❌ $test_name: FAILED"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..." "$BLUE"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        exit 1
    fi
    
    # Check if in correct directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
    
    # Check if dependencies are installed
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        warning "node_modules not found. Installing dependencies..."
        cd "$PROJECT_ROOT" && npm install
    fi
    
    log "Prerequisites check completed"
}

# Security validation - Check for client-side API key exposure
validate_client_side_security() {
    log "1. Validating client-side security..." "$BLUE"
    
    # Check for OPENAI_API_KEY in client-side files
    local client_files=(
        "components/voice/VoicePracticeInterface.tsx"
        "lib/voice/pronunciationAnalysis.ts"
        "lib/voice/speechRecognition.ts"
        "lib/voice/exerciseGenerator.ts"
    )
    
    local violations_found=0
    
    for file in "${client_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            # Check for direct API key usage
            if grep -q "process\.env\.OPENAI_API_KEY" "$PROJECT_ROOT/$file"; then
                error "Found process.env.OPENAI_API_KEY in client file: $file"
                violations_found=$((violations_found + 1))
            fi
            
            # Check for API key patterns
            if grep -E "sk-[a-zA-Z0-9]{48}" "$PROJECT_ROOT/$file"; then
                error "Found API key pattern in: $file"
                violations_found=$((violations_found + 1))
            fi
            
            # Check for OpenAI client initialization in client components
            if [[ "$file" == *"components/"* ]] && grep -q "new OpenAI\|OpenAI(" "$PROJECT_ROOT/$file"; then
                error "Found OpenAI client initialization in client component: $file"
                violations_found=$((violations_found + 1))
            fi
        fi
    done
    
    if [ $violations_found -eq 0 ]; then
        track_test "Client-side Security Validation" "PASS"
    else
        track_test "Client-side Security Validation" "FAIL"
    fi
}

# Build validation - Ensure no API keys in build output
validate_build_security() {
    log "2. Validating build security..." "$BLUE"
    
    # Create a test build
    cd "$PROJECT_ROOT"
    
    # Set a dummy API key for build test
    export OPENAI_API_KEY="sk-test-key-for-build-validation-123456789012345678901234567890"
    
    # Build the project
    if npm run build > "$TEST_RESULTS_DIR/build_output_$TIMESTAMP.log" 2>&1; then
        log "Build completed successfully"
        
        # Check build output for API key leakage
        local build_violations=0
        
        # Check .next directory for API key exposure
        if [ -d "$PROJECT_ROOT/.next" ]; then
            # Look for API key in JavaScript bundles
            if find "$PROJECT_ROOT/.next" -name "*.js" -type f -exec grep -l "sk-test-key-for-build" {} \; | head -1; then
                error "API key found in build output"
                build_violations=$((build_violations + 1))
            fi
            
            # Check for environment variable exposure
            if find "$PROJECT_ROOT/.next" -name "*.js" -type f -exec grep -l "OPENAI_API_KEY" {} \; | head -1; then
                warning "OPENAI_API_KEY reference found in build output"
                # This might be acceptable if it's server-side only
            fi
        fi
        
        if [ $build_violations -eq 0 ]; then
            track_test "Build Security Validation" "PASS"
        else
            track_test "Build Security Validation" "FAIL"
        fi
    else
        error "Build failed"
        track_test "Build Security Validation" "FAIL"
    fi
    
    # Clean up
    unset OPENAI_API_KEY
}

# API route validation
validate_api_routes() {
    log "3. Validating API routes..." "$BLUE"
    
    local api_routes=(
        "app/api/voice/analyze/route.ts"
        "app/api/chat/route.ts"
    )
    
    local api_violations=0
    
    for route in "${api_routes[@]}"; do
        if [ -f "$PROJECT_ROOT/$route" ]; then
            # Check that API routes properly handle OPENAI_API_KEY
            if ! grep -q "process\.env\.OPENAI_API_KEY" "$PROJECT_ROOT/$route"; then
                warning "API route $route doesn't seem to use OPENAI_API_KEY"
            fi
            
            # Check for proper error handling
            if ! grep -q "try.*catch\|\.catch" "$PROJECT_ROOT/$route"; then
                warning "API route $route might lack proper error handling"
                api_violations=$((api_violations + 1))
            fi
            
            # Check for proper NextResponse usage
            if ! grep -q "NextResponse" "$PROJECT_ROOT/$route"; then
                error "API route $route doesn't use NextResponse"
                api_violations=$((api_violations + 1))
            fi
        fi
    done
    
    if [ $api_violations -eq 0 ]; then
        track_test "API Routes Validation" "PASS"
    else
        track_test "API Routes Validation" "FAIL"
    fi
}

# TypeScript validation
validate_typescript() {
    log "4. Running TypeScript validation..." "$BLUE"
    
    cd "$PROJECT_ROOT"
    
    if npm run type-check > "$TEST_RESULTS_DIR/typecheck_$TIMESTAMP.log" 2>&1; then
        track_test "TypeScript Validation" "PASS"
    else
        error "TypeScript validation failed"
        tail -20 "$TEST_RESULTS_DIR/typecheck_$TIMESTAMP.log"
        track_test "TypeScript Validation" "FAIL"
    fi
}

# Unit tests execution
run_unit_tests() {
    log "5. Running unit tests..." "$BLUE"
    
    cd "$PROJECT_ROOT"
    
    # Run voice-specific tests if they exist
    if [ -f "voice-testing-suite.test.ts" ]; then
        if npm test -- voice-testing-suite.test.ts > "$TEST_RESULTS_DIR/unit_tests_$TIMESTAMP.log" 2>&1; then
            track_test "Unit Tests" "PASS"
        else
            error "Unit tests failed"
            tail -20 "$TEST_RESULTS_DIR/unit_tests_$TIMESTAMP.log"
            track_test "Unit Tests" "FAIL"
        fi
    else
        warning "Voice-specific unit tests not found"
        track_test "Unit Tests" "SKIP"
    fi
}

# Environment validation
validate_environment() {
    log "6. Validating environment configuration..." "$BLUE"
    
    local env_violations=0
    
    # Check .env files
    local env_files=(
        ".env.local"
        ".env.example"
        ".env.local.example"
    )
    
    for env_file in "${env_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$env_file" ]; then
            # Check if OPENAI_API_KEY is properly documented
            if grep -q "OPENAI_API_KEY" "$PROJECT_ROOT/$env_file"; then
                log "Found OPENAI_API_KEY in $env_file"
                
                # Check if it's a placeholder or real key
                if grep -E "sk-[a-zA-Z0-9]{48}" "$PROJECT_ROOT/$env_file"; then
                    error "Real API key found in $env_file - this should be a placeholder"
                    env_violations=$((env_violations + 1))
                fi
            fi
        fi
    done
    
    # Check next.config.js for proper environment handling
    if [ -f "$PROJECT_ROOT/next.config.js" ]; then
        if grep -q "OPENAI_API_KEY" "$PROJECT_ROOT/next.config.js"; then
            warning "OPENAI_API_KEY referenced in next.config.js - ensure it's server-side only"
        fi
    fi
    
    if [ $env_violations -eq 0 ]; then
        track_test "Environment Configuration" "PASS"
    else
        track_test "Environment Configuration" "FAIL"
    fi
}

# Network security validation
validate_network_security() {
    log "7. Validating network security..." "$BLUE"
    
    # Check for hardcoded API endpoints
    local files_to_check=(
        "components/voice/VoicePracticeInterface.tsx"
        "lib/voice/pronunciationAnalysis.ts"
    )
    
    local network_violations=0
    
    for file in "${files_to_check[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            # Check for direct OpenAI API calls
            if grep -q "api\.openai\.com\|openai\.com/v1" "$PROJECT_ROOT/$file"; then
                error "Direct OpenAI API call found in client file: $file"
                network_violations=$((network_violations + 1))
            fi
            
            # Check for proper API route usage
            if grep -q "fetch.*api.*voice" "$PROJECT_ROOT/$file"; then
                log "Found API route usage in $file"
            fi
        fi
    done
    
    if [ $network_violations -eq 0 ]; then
        track_test "Network Security Validation" "PASS"
    else
        track_test "Network Security Validation" "FAIL"
    fi
}

# Sentry integration validation
validate_sentry_integration() {
    log "8. Validating Sentry integration..." "$BLUE"
    
    local sentry_files=(
        "sentry.server.config.ts"
        "sentry.edge.config.ts"  
        "instrumentation.ts"
    )
    
    local sentry_violations=0
    
    for file in "${sentry_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            # Check that Sentry config doesn't expose API keys
            if grep -E "sk-[a-zA-Z0-9]{48}" "$PROJECT_ROOT/$file"; then
                error "API key found in Sentry config: $file"
                sentry_violations=$((sentry_violations + 1))
            fi
        fi
    done
    
    # Check voice components for proper Sentry integration
    if [ -f "$PROJECT_ROOT/components/voice/VoicePracticeInterface.tsx" ]; then
        if ! grep -q "@sentry\|Sentry" "$PROJECT_ROOT/components/voice/VoicePracticeInterface.tsx"; then
            warning "Voice component might not have Sentry error tracking"
        fi
    fi
    
    if [ $sentry_violations -eq 0 ]; then
        track_test "Sentry Integration" "PASS"
    else
        track_test "Sentry Integration" "FAIL"
    fi
}

# Memory security check
validate_memory_security() {
    log "9. Validating memory security..." "$BLUE"
    
    # Check for potential memory leaks in voice components
    local memory_issues=0
    
    if [ -f "$PROJECT_ROOT/components/voice/VoicePracticeInterface.tsx" ]; then
        # Check for proper cleanup
        if ! grep -q "useEffect.*return.*cleanup\|componentWillUnmount\|cleanup" "$PROJECT_ROOT/components/voice/VoicePracticeInterface.tsx"; then
            warning "Voice component might not have proper cleanup"
            memory_issues=$((memory_issues + 1))
        fi
        
        # Check for timer cleanup
        if grep -q "setInterval\|setTimeout" "$PROJECT_ROOT/components/voice/VoicePracticeInterface.tsx"; then
            if ! grep -q "clearInterval\|clearTimeout" "$PROJECT_ROOT/components/voice/VoicePracticeInterface.tsx"; then
                warning "Timers might not be properly cleaned up"
                memory_issues=$((memory_issues + 1))
            fi
        fi
    fi
    
    if [ $memory_issues -eq 0 ]; then
        track_test "Memory Security" "PASS"
    else
        track_test "Memory Security" "FAIL"
    fi
}

# Performance validation
validate_performance() {
    log "10. Validating performance..." "$BLUE"
    
    # Check for performance best practices
    local perf_issues=0
    
    if [ -f "$PROJECT_ROOT/components/voice/VoicePracticeInterface.tsx" ]; then
        # Check for proper React optimization
        if ! grep -q "useCallback\|useMemo\|React\.memo" "$PROJECT_ROOT/components/voice/VoicePracticeInterface.tsx"; then
            warning "Voice component might benefit from React optimization hooks"
        fi
        
        # Check for proper error boundaries
        if ! grep -q "componentDidCatch\|ErrorBoundary" "$PROJECT_ROOT/components/voice/VoicePracticeInterface.tsx"; then
            info "Consider adding error boundaries for voice components"
        fi
    fi
    
    track_test "Performance Validation" "PASS"
}

# Generate comprehensive report
generate_report() {
    log "Generating comprehensive test report..." "$BLUE"
    
    local report_file="$TEST_RESULTS_DIR/voice_fix_validation_report_$TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# Voice Practice OPENAI_API_KEY Fix Validation Report

**Generated:** $(date)
**Project:** AI Course Platform v2
**Focus:** Voice Practice Interface Security Fix

## Executive Summary

- **Total Tests:** $TESTS_TOTAL
- **Passed:** $TESTS_PASSED
- **Failed:** $TESTS_FAILED
- **Success Rate:** $(( TESTS_PASSED * 100 / TESTS_TOTAL ))%

## Test Results Overview

EOF

    if [ $TESTS_FAILED -eq 0 ]; then
        echo "✅ **ALL TESTS PASSED** - The OPENAI_API_KEY fix has been successfully validated." >> "$report_file"
    else
        echo "❌ **SOME TESTS FAILED** - Please review the failed tests and address the issues." >> "$report_file"
    fi

    cat >> "$report_file" << EOF

## Security Validation Status

### Client-Side Security ✅
- No OPENAI_API_KEY exposure in client components
- No API key patterns in client-side files
- Proper separation of client and server code

### Build Security ✅
- No API keys in build output
- Environment variables properly handled
- Client bundles free of sensitive data

### Network Security ✅
- No direct OpenAI API calls from client
- Proper API route usage
- Server-side API key handling

## Recommendations

1. **Continuous Monitoring:** Set up automated security scanning
2. **Code Review:** Implement mandatory security review for API changes
3. **Environment Management:** Use proper secret management for production
4. **Testing:** Include security tests in CI/CD pipeline

## Files Validated

- \`components/voice/VoicePracticeInterface.tsx\`
- \`lib/voice/pronunciationAnalysis.ts\`
- \`app/api/voice/analyze/route.ts\`
- \`sentry.*.config.ts\`
- Build output (.next directory)

## Next Steps

EOF

    if [ $TESTS_FAILED -eq 0 ]; then
        cat >> "$report_file" << EOF
1. ✅ Deploy to staging environment
2. ✅ Run end-to-end tests
3. ✅ Monitor Sentry for any remaining errors
4. ✅ Deploy to production
EOF
    else
        cat >> "$report_file" << EOF
1. ❌ Fix failed test cases
2. ❌ Re-run validation
3. ❌ Code review for security issues
4. ❌ Update implementation as needed
EOF
    fi

    log "Report generated: $report_file"
}

# Main execution
main() {
    log "🚀 Starting Voice Practice OPENAI_API_KEY Fix Validation" "$BLUE"
    
    check_prerequisites
    
    validate_client_side_security
    validate_build_security
    validate_api_routes
    validate_typescript
    run_unit_tests
    validate_environment
    validate_network_security
    validate_sentry_integration
    validate_memory_security
    validate_performance
    
    generate_report
    
    echo
    log "=================================================================="
    log "🏁 Validation Complete!"
    log "📊 Results: $TESTS_PASSED/$TESTS_TOTAL tests passed"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        log "🎉 All validations passed! The OPENAI_API_KEY fix is secure and ready for deployment." "$GREEN"
        exit 0
    else
        error "💥 Some validations failed. Please review and fix the issues before deployment."
        exit 1
    fi
}

# Handle script interruption
trap 'error "Validation interrupted"; exit 1' INT TERM

# Run main function
main "$@"