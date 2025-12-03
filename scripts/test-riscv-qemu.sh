#!/bin/bash
set -euo pipefail

# RISC-V QEMU Testing Script
# Tests SSZ Universal Verifier with QEMU user-mode emulation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "RISC-V QEMU SSZ Verifier Tests"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check for RISC-V toolchain
if ! command -v riscv64-linux-gnu-gcc &> /dev/null; then
    echo -e "${RED}✗ RISC-V toolchain not found${NC}"
    echo ""
    echo "Install with:"
    echo "  Ubuntu/Debian: sudo apt-get install gcc-riscv64-linux-gnu"
    echo "  macOS: brew install riscv-gnu-toolchain"
    exit 1
fi

# Check for QEMU
if ! command -v qemu-riscv64-static &> /dev/null && ! command -v qemu-riscv64 &> /dev/null; then
    echo -e "${RED}✗ QEMU RISC-V not found${NC}"
    echo ""
    echo "Install with:"
    echo "  Ubuntu/Debian: sudo apt-get install qemu-user qemu-user-static"
    echo "  macOS: brew install qemu"
    exit 1
fi

echo -e "${GREEN}✓ RISC-V toolchain found${NC}"
echo -e "${GREEN}✓ QEMU found${NC}"
echo ""

# Detect QEMU binary
if command -v qemu-riscv64-static &> /dev/null; then
    QEMU="qemu-riscv64-static"
else
    QEMU="qemu-riscv64"
fi

# Build for RISC-V
echo "Building for RISC-V..."
cd "$PROJECT_ROOT/c-skel"

export CC=riscv64-linux-gnu-gcc
make clean
make test-riscv

if [ ! -f "build/test_ssz" ]; then
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Run with QEMU
echo "Running tests with QEMU..."
echo "========================================"

$QEMU -L /usr/riscv64-linux-gnu ./build/test_ssz

EXIT_CODE=$?

echo ""
echo "========================================"
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ RISC-V QEMU tests PASSED${NC}"
    echo ""
    echo "Your SSZ verifier runs on RISC-V! 🚀"
    echo ""
    echo "Performance notes:"
    echo "  - QEMU is emulated (slower than real hardware)"
    echo "  - Real hardware: VisionFive 2, Milk-V Mars, etc."
    echo "  - zkVM: RISC Zero, SP1 (proof generation)"
else
    echo -e "${RED}✗ RISC-V QEMU tests FAILED${NC}"
fi
echo "========================================"

exit $EXIT_CODE
