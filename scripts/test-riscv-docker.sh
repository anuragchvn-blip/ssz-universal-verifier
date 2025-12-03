#!/bin/bash
set -euo pipefail

# RISC-V Docker Testing Script
# Runs SSZ Universal Verifier tests in RISC-V Ubuntu environment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "RISC-V SSZ Universal Verifier Tests"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✓ Docker found${NC}"
echo ""

# Pull RISC-V Ubuntu image
echo "Pulling RISC-V Ubuntu 22.04 image..."
docker pull riscv64/ubuntu:22.04
echo ""

# Run tests
echo "Running RISC-V tests in Docker..."
echo "========================================"

docker run --rm \
    -v "$PROJECT_ROOT:/work" \
    -w /work/c-skel \
    riscv64/ubuntu:22.04 \
    bash -c "
        set -e
        
        # Install build tools
        echo 'Installing build tools...'
        apt-get update -qq
        apt-get install -y -qq build-essential > /dev/null 2>&1
        
        # Show environment
        echo ''
        echo '=== RISC-V Environment ==='
        uname -m
        gcc --version | head -n1
        echo ''
        
        # Build and run tests
        echo '=== Building SSZ Verifier ==='
        make clean
        make test-riscv
        
        echo ''
        echo '✓ All RISC-V tests passed!'
    "

EXIT_CODE=$?

echo ""
echo "========================================"
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ RISC-V tests PASSED${NC}"
    echo ""
    echo "Your SSZ verifier is RISC-V compatible! 🎉"
    echo ""
    echo "Next steps:"
    echo "  - Test with QEMU: ./scripts/test-riscv-qemu.sh"
    echo "  - Benchmark on real hardware: VisionFive 2, etc."
    echo "  - Integrate with RISC Zero zkVM"
else
    echo -e "${RED}✗ RISC-V tests FAILED${NC}"
    echo ""
    echo "Check the output above for errors."
fi
echo "========================================"

exit $EXIT_CODE
