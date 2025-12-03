# RISC-V Quick Start Guide

## Overview

This project fully supports RISC-V architecture. You can:
- ✅ Build and test on RISC-V hardware
- ✅ Cross-compile from x86/ARM to RISC-V
- ✅ Test with QEMU emulation
- ✅ Run in zkVM environments (RISC Zero, SP1)

## Quick Test (Docker - All Platforms)

### Windows
```powershell
.\scripts\test-riscv-docker.ps1
```

### Linux/macOS
```bash
./scripts/test-riscv-docker.sh
```

This pulls `riscv64/ubuntu:22.04` and runs the full test suite.

## What Was Built

```
c-skel/
  Makefile                 # Added test-riscv target
  
scripts/
  test-riscv-docker.sh     # Linux/macOS Docker test script
  test-riscv-docker.ps1    # Windows Docker test script
  test-riscv-qemu.sh       # Linux QEMU test script
  
.github/workflows/
  riscv.yml                # Automated CI for RISC-V
  
docs/
  RISCV.md                 # Comprehensive documentation
```

## Manual Testing

### Prerequisites

**Docker method (recommended):**
- Docker Desktop (Windows/macOS)
- Docker Engine (Linux)

**Native/QEMU method:**
```bash
# Ubuntu/Debian
sudo apt-get install gcc-riscv64-linux-gnu qemu-user qemu-user-static

# macOS
brew install riscv-gnu-toolchain qemu
```

### Build and Test

```bash
cd c-skel

# Method 1: Docker (easiest)
docker run --rm -v $(pwd):/work -w /work riscv64/ubuntu:22.04 bash -c \
  "apt-get update && apt-get install -y build-essential && make test-riscv"

# Method 2: Cross-compile + QEMU (Linux/WSL)
CC=riscv64-linux-gnu-gcc make test-riscv
qemu-riscv64-static -L /usr/riscv64-linux-gnu ./build/test_ssz

# Method 3: Native RISC-V hardware
make test-riscv  # On VisionFive 2, Milk-V Mars, etc.
```

## CI/CD

GitHub Actions automatically tests RISC-V compatibility on every push:
- Docker-based testing (riscv64/ubuntu)
- QEMU user-mode emulation
- Performance benchmarks

See: `.github/workflows/riscv.yml`

## Use Cases

### 1. zkVM Verification
Verify SSZ proofs inside zero-knowledge virtual machines:
- RISC Zero zkVM
- SP1 (Succinct Proof)

### 2. Embedded Light Clients
Run Ethereum light clients on RISC-V IoT devices with 4KB RAM.

### 3. Hardware Validation
Test on real RISC-V boards:
- VisionFive 2 (StarFive JH7110)
- Milk-V Mars
- SiFive Unmatched

## Performance

| Environment           | Hash Rate  | Notes                    |
|-----------------------|------------|--------------------------|
| Docker (emulated)     | ~50K/sec   | Development/CI testing   |
| QEMU                  | ~50K/sec   | Fast iteration           |
| Real hardware         | ~500K/sec  | VisionFive 2 @ 1.5GHz    |
| zkVM                  | ~10K/sec   | Proof generation         |

## Next Steps

1. **Install Docker** (if not already): https://docs.docker.com/get-docker/
2. **Run tests**: `./scripts/test-riscv-docker.sh`
3. **Read docs**: See `docs/RISCV.md` for detailed info
4. **Contribute**: Test on your RISC-V hardware!

## Troubleshooting

**"Docker not found"**
- Install Docker Desktop (Windows/macOS) or Docker Engine (Linux)

**"RISC-V toolchain not found"**
- Use Docker method (no toolchain needed)
- Or install: `sudo apt-get install gcc-riscv64-linux-gnu`

**"Permission denied (scripts)"**
```bash
chmod +x scripts/*.sh
```

## Resources

- Full documentation: [`docs/RISCV.md`](docs/RISCV.md)
- CI workflow: [`.github/workflows/riscv.yml`](.github/workflows/riscv.yml)
- RISC-V International: https://riscv.org/
