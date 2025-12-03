#!/bin/bash
# Valgrind memory safety analysis for SSZ Universal Verifier

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
C_SKEL_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$C_SKEL_DIR/build"
TEST_BIN="$BUILD_DIR/test_ssz"

echo "=== SSZ Universal Verifier - Valgrind Memory Safety Analysis ==="
echo ""

# Check if valgrind is installed
if ! command -v valgrind &> /dev/null; then
    echo "ERROR: Valgrind is not installed"
    echo ""
    echo "Installation instructions:"
    echo "  Ubuntu/Debian: sudo apt-get install valgrind"
    echo "  Fedora/RHEL:   sudo dnf install valgrind"
    echo "  macOS:         brew install valgrind"
    echo "  Windows:       Use WSL2 and install in Linux"
    exit 1
fi

# Build test suite with debug symbols
echo "Building test suite with debug symbols..."
cd "$C_SKEL_DIR"
make clean
make CFLAGS="-g -O0 -DHOST_TEST" test

if [ ! -f "$TEST_BIN" ]; then
    echo "ERROR: Test binary not found at $TEST_BIN"
    exit 1
fi

echo ""
echo "=== Running Valgrind Checks ==="
echo ""

# 1. Memory leak detection
echo "--- Memory Leak Detection ---"
valgrind \
    --leak-check=full \
    --show-leak-kinds=all \
    --track-origins=yes \
    --verbose \
    --log-file="$BUILD_DIR/valgrind-leak.log" \
    "$TEST_BIN"

echo ""
echo "Leak check complete. Log: $BUILD_DIR/valgrind-leak.log"
echo ""

# Check for leaks
if grep -q "definitely lost: 0 bytes" "$BUILD_DIR/valgrind-leak.log" && \
   grep -q "indirectly lost: 0 bytes" "$BUILD_DIR/valgrind-leak.log"; then
    echo "✓ No memory leaks detected"
else
    echo "✗ Memory leaks detected! See log for details."
    grep "definitely lost\|indirectly lost" "$BUILD_DIR/valgrind-leak.log"
fi

echo ""

# 2. Uninitialized memory detection
echo "--- Uninitialized Memory Detection ---"
valgrind \
    --tool=memcheck \
    --track-origins=yes \
    --undef-value-errors=yes \
    --log-file="$BUILD_DIR/valgrind-uninit.log" \
    "$TEST_BIN"

echo ""
echo "Uninitialized memory check complete. Log: $BUILD_DIR/valgrind-uninit.log"
echo ""

# Check for uninitialized reads
if grep -q "Use of uninitialised value" "$BUILD_DIR/valgrind-uninit.log"; then
    echo "✗ Uninitialized memory reads detected! See log for details."
    grep "Use of uninitialised value" "$BUILD_DIR/valgrind-uninit.log" | head -5
else
    echo "✓ No uninitialized memory reads"
fi

echo ""

# 3. Invalid memory access detection
echo "--- Invalid Memory Access Detection ---"
valgrind \
    --tool=memcheck \
    --read-var-info=yes \
    --log-file="$BUILD_DIR/valgrind-access.log" \
    "$TEST_BIN"

echo ""
echo "Invalid access check complete. Log: $BUILD_DIR/valgrind-access.log"
echo ""

# Check for invalid accesses
if grep -q "Invalid read\|Invalid write" "$BUILD_DIR/valgrind-access.log"; then
    echo "✗ Invalid memory accesses detected! See log for details."
    grep "Invalid read\|Invalid write" "$BUILD_DIR/valgrind-access.log" | head -5
else
    echo "✓ No invalid memory accesses"
fi

echo ""

# 4. Cache profiling (optional, for performance insights)
echo "--- Cache Profiling ---"
valgrind \
    --tool=cachegrind \
    --log-file="$BUILD_DIR/valgrind-cache.log" \
    --cachegrind-out-file="$BUILD_DIR/cachegrind.out" \
    "$TEST_BIN" > /dev/null

echo ""
echo "Cache profiling complete. Log: $BUILD_DIR/valgrind-cache.log"
echo ""

if command -v cg_annotate &> /dev/null; then
    echo "Cache statistics:"
    cg_annotate "$BUILD_DIR/cachegrind.out" | head -20
else
    echo "Install cg_annotate for detailed cache analysis"
fi

echo ""

# 5. Heap profiling (optional, for memory usage insights)
echo "--- Heap Profiling ---"
valgrind \
    --tool=massif \
    --massif-out-file="$BUILD_DIR/massif.out" \
    "$TEST_BIN" > /dev/null

echo ""
echo "Heap profiling complete. Output: $BUILD_DIR/massif.out"
echo ""

if command -v ms_print &> /dev/null; then
    echo "Peak memory usage:"
    ms_print "$BUILD_DIR/massif.out" | grep -A 5 "peak"
else
    echo "Install ms_print for detailed heap analysis"
fi

echo ""

# Summary
echo "=== Valgrind Analysis Summary ==="
echo ""

ISSUES=0

if ! grep -q "definitely lost: 0 bytes" "$BUILD_DIR/valgrind-leak.log" || \
   ! grep -q "indirectly lost: 0 bytes" "$BUILD_DIR/valgrind-leak.log"; then
    echo "✗ Memory leaks found"
    ISSUES=$((ISSUES + 1))
else
    echo "✓ No memory leaks"
fi

if grep -q "Use of uninitialised value" "$BUILD_DIR/valgrind-uninit.log"; then
    echo "✗ Uninitialized memory reads found"
    ISSUES=$((ISSUES + 1))
else
    echo "✓ No uninitialized memory reads"
fi

if grep -q "Invalid read\|Invalid write" "$BUILD_DIR/valgrind-access.log"; then
    echo "✗ Invalid memory accesses found"
    ISSUES=$((ISSUES + 1))
else
    echo "✓ No invalid memory accesses"
fi

echo ""
echo "Total issues found: $ISSUES"
echo ""

if [ $ISSUES -eq 0 ]; then
    echo "✓✓✓ ALL VALGRIND CHECKS PASSED ✓✓✓"
    echo ""
    echo "The SSZ Universal Verifier C implementation is memory-safe!"
    exit 0
else
    echo "✗✗✗ VALGRIND CHECKS FAILED ✗✗✗"
    echo ""
    echo "Please fix the issues above before deployment."
    echo "See detailed logs in $BUILD_DIR/valgrind-*.log"
    exit 1
fi
