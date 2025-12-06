#!/bin/bash
# Comprehensive test runner with coverage and reporting

set -e

FAILED_TESTS=()
TOTAL_TESTS=0
PASSED_TESTS=0

run_test() {
    local name=$1
    local command=$2
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🧪 Running: $name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$command"; then
        echo "✅ PASSED: $name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "❌ FAILED: $name"
        FAILED_TESTS+=("$name")
    fi
    echo ""
}

echo "🚀 SSZ Universal Verifier - Comprehensive Test Suite"
echo ""

# TypeScript Tests
run_test "TypeScript Basic Tests" "npm run test:basic"
run_test "TypeScript Extended Tests" "npm run test:extended"
run_test "Cross-Platform Tests" "npm run test:cross-platform"

# Rust Tests
run_test "Rust Tests" "cd rust-skel && cargo test --release"

# C Tests
run_test "C Tests" "cd c-skel && make test"

# Valgrind (if available)
if command -v valgrind &> /dev/null; then
    run_test "Valgrind Memory Check" "cd c-skel/valgrind && bash run_valgrind.sh"
else
    echo "⚠️  Valgrind not available, skipping memory checks"
fi

# WASM Tests
if [ -d "wasm" ]; then
    run_test "WASM Build" "cd wasm && npm run build"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: ${#FAILED_TESTS[@]}"
echo ""

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Failed tests:"
    for test in "${FAILED_TESTS[@]}"; do
        echo "  - $test"
    done
    exit 1
fi
