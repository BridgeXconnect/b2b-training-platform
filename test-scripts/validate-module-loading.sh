#!/bin/bash

# Module Loading Validation Script
# Tests production JavaScript chunk loading optimizations

set -e

echo "🔍 Module Loading Validation - AI Course Platform"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

# Test result tracking
print_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ $test_name: PASSED${NC} - $message"
        ((TESTS_PASSED++))
    elif [ "$result" = "FAIL" ]; then
        echo -e "${RED}❌ $test_name: FAILED${NC} - $message"
        ((TESTS_FAILED++))
    elif [ "$result" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  $test_name: WARNING${NC} - $message"
        ((WARNINGS++))
    fi
}

echo "🧪 Running Module Loading Tests..."
echo ""

# Test 1: Check if chunk retry polyfill exists
echo "1️⃣  Testing Chunk Retry Polyfill..."
if [ -f "lib/utils/chunk-retry-polyfill.js" ]; then
    print_result "Chunk Retry Polyfill" "PASS" "Polyfill file exists"
    
    # Check if polyfill has proper retry logic
    if grep -q "retryChunkLoad" lib/utils/chunk-retry-polyfill.js; then
        print_result "Retry Logic" "PASS" "Retry mechanism implemented"
    else
        print_result "Retry Logic" "FAIL" "Retry mechanism missing"
    fi
    
    # Check if exponential backoff is implemented
    if grep -q "backoffMultiplier" lib/utils/chunk-retry-polyfill.js; then
        print_result "Exponential Backoff" "PASS" "Backoff strategy implemented"
    else
        print_result "Exponential Backoff" "WARN" "Basic retry without backoff"
    fi
else
    print_result "Chunk Retry Polyfill" "FAIL" "Polyfill file missing"
fi

# Test 2: Check Next.js configuration optimizations
echo ""
echo "2️⃣  Testing Next.js Configuration..."
if [ -f "next.config.js" ]; then
    print_result "Next Config" "PASS" "Configuration file exists"
    
    # Check webpack optimizations
    if grep -q "chunkLoadTimeout" next.config.js; then
        print_result "Chunk Load Timeout" "PASS" "Timeout configuration found"
    else
        print_result "Chunk Load Timeout" "WARN" "Default timeout used"
    fi
    
    # Check split chunks configuration
    if grep -q "splitChunks" next.config.js; then
        print_result "Chunk Splitting" "PASS" "Advanced chunk splitting configured"
    else
        print_result "Chunk Splitting" "FAIL" "Chunk splitting not optimized"
    fi
    
    # Check if polyfill is injected
    if grep -q "chunk-retry-polyfill.js" next.config.js; then
        print_result "Polyfill Injection" "PASS" "Polyfill properly injected"
    else
        print_result "Polyfill Injection" "FAIL" "Polyfill not injected into build"
    fi
else
    print_result "Next Config" "FAIL" "next.config.js missing"
fi

# Test 3: Check Error Boundary Implementation
echo ""
echo "3️⃣  Testing Error Boundary Implementation..."
if [ -f "components/ui/ChunkLoadErrorBoundary.tsx" ]; then
    print_result "Error Boundary" "PASS" "ChunkLoadErrorBoundary component exists"
    
    # Check if it handles chunk load errors specifically
    if grep -q "ChunkLoadError" components/ui/ChunkLoadErrorBoundary.tsx; then
        print_result "Chunk Error Detection" "PASS" "Chunk load error detection implemented"
    else
        print_result "Chunk Error Detection" "FAIL" "Generic error boundary only"
    fi
    
    # Check for retry functionality
    if grep -q "handleRetry" components/ui/ChunkLoadErrorBoundary.tsx; then
        print_result "Error Recovery" "PASS" "Retry functionality implemented"
    else
        print_result "Error Recovery" "WARN" "Limited recovery options"
    fi
else
    print_result "Error Boundary" "FAIL" "ChunkLoadErrorBoundary missing"
fi

# Test 4: Check Root Layout Integration
echo ""
echo "4️⃣  Testing Root Layout Integration..."
if [ -f "app/layout.tsx" ]; then
    print_result "Root Layout" "PASS" "Layout file exists"
    
    # Check if error boundary is integrated
    if grep -q "ChunkLoadErrorBoundary" app/layout.tsx; then
        print_result "Error Boundary Integration" "PASS" "Error boundary integrated in root layout"
    else
        print_result "Error Boundary Integration" "WARN" "Error boundary not in root layout"
    fi
else
    print_result "Root Layout" "FAIL" "app/layout.tsx missing"
fi

# Test 5: Check Dynamic Import Helper
echo ""
echo "5️⃣  Testing Dynamic Import Helper..."
if [ -f "lib/utils/dynamic-import-helper.ts" ]; then
    print_result "Dynamic Import Helper" "PASS" "Helper utility exists"
    
    # Check for retry functionality
    if grep -q "dynamicImportWithRetry" lib/utils/dynamic-import-helper.ts; then
        print_result "Import Retry Logic" "PASS" "Dynamic import retry implemented"
    else
        print_result "Import Retry Logic" "FAIL" "Basic dynamic imports only"
    fi
    
    # Check for React integration
    if grep -q "lazyLoadComponent" lib/utils/dynamic-import-helper.ts; then
        print_result "React Integration" "PASS" "React component lazy loading supported"
    else
        print_result "React Integration" "WARN" "Limited React integration"
    fi
else
    print_result "Dynamic Import Helper" "FAIL" "Dynamic import helper missing"
fi

# Test 6: Production Build Validation
echo ""
echo "6️⃣  Testing Production Build..."

# Check if we can run a production build
if command -v npm >/dev/null 2>&1; then
    echo "Running production build test..."
    
    # Attempt a production build (with timeout)
    timeout 300s npm run build > /tmp/build_output.log 2>&1 || BUILD_FAILED=1
    
    if [ -z "$BUILD_FAILED" ]; then
        print_result "Production Build" "PASS" "Build completed successfully"
        
        # Check build output for chunk information
        if [ -d ".next/static" ]; then
            CHUNK_COUNT=$(find .next/static -name "*.js" | wc -l)
            if [ "$CHUNK_COUNT" -gt 0 ]; then
                print_result "Chunk Generation" "PASS" "$CHUNK_COUNT chunks generated"
            else
                print_result "Chunk Generation" "FAIL" "No chunks found in build output"
            fi
        else
            print_result "Build Output" "FAIL" "Build output directory missing"
        fi
    else
        print_result "Production Build" "FAIL" "Build failed or timed out"
        echo "Build log:"
        cat /tmp/build_output.log | tail -20
    fi
else
    print_result "Production Build" "WARN" "npm not available for build testing"
fi

# Test 7: Bundle Analysis
echo ""
echo "7️⃣  Testing Bundle Analysis..."

if [ -f "package.json" ] && grep -q "webpack-bundle-analyzer" package.json; then
    print_result "Bundle Analyzer" "PASS" "Bundle analyzer available"
else
    print_result "Bundle Analyzer" "WARN" "Bundle analyzer not configured"
fi

# Test 8: Service Worker Integration
echo ""
echo "8️⃣  Testing Service Worker Integration..."

if grep -q "serviceWorker" lib/utils/chunk-retry-polyfill.js; then
    print_result "Service Worker Integration" "PASS" "Service worker integration found"
else
    print_result "Service Worker Integration" "WARN" "No service worker integration"
fi

# Performance Tests
echo ""
echo "9️⃣  Performance Configuration Tests..."

# Check if performance budgets are set
if grep -q "maxEntrypointSize" next.config.js; then
    print_result "Performance Budgets" "PASS" "Performance budgets configured"
else
    print_result "Performance Budgets" "WARN" "No performance budgets set"
fi

# Check tree shaking configuration
if grep -q "usedExports" next.config.js; then
    print_result "Tree Shaking" "PASS" "Tree shaking enabled"
else
    print_result "Tree Shaking" "WARN" "Tree shaking not optimized"
fi

# Security Tests
echo ""
echo "🔟 Security Configuration Tests..."

# Check CORS settings for chunks
if grep -q "crossOriginLoading" next.config.js; then
    print_result "CORS Configuration" "PASS" "Cross-origin loading configured"
else
    print_result "CORS Configuration" "WARN" "Default CORS settings"
fi

# Final Summary
echo ""
echo "📊 Validation Summary"
echo "==================="
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED + WARNINGS))
echo "Total Tests: $TOTAL_TESTS"

# Overall result
if [ $TESTS_FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All module loading optimizations are properly configured!${NC}"
        exit 0
    else
        echo -e "\n${YELLOW}✅ Module loading is functional with minor recommendations.${NC}"
        exit 0
    fi
else
    echo -e "\n${RED}❌ Critical issues found. Please address failed tests before production deployment.${NC}"
    exit 1
fi