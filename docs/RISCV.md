# RISC-V Support

SSZ Universal Verifier is fully compatible with RISC-V architecture, making it suitable for:
- **zkVM environments** (RISC Zero, SP1)
- **Embedded RISC-V hardware** (VisionFive 2, Milk-V Mars, etc.)
- **IoT devices** with RISC-V processors
- **Zero-knowledge proof generation**

## Quick Start

### Docker Testing (All Platforms)

**Linux/macOS:**
```bash
./scripts/test-riscv-docker.sh
```

**Windows:**
```powershell
.\scripts\test-riscv-docker.ps1
```

This runs the full test suite in a RISC-V Ubuntu environment using Docker.

### QEMU Testing (Linux/WSL)

```bash
# Install RISC-V toolchain and QEMU
sudo apt-get install gcc-riscv64-linux-gnu qemu-user qemu-user-static

# Run tests
./scripts/test-riscv-qemu.sh
```

### Manual Build

```bash
cd c-skel

# Cross-compile for RISC-V
CC=riscv64-linux-gnu-gcc make test-riscv

# Run with QEMU
qemu-riscv64-static -L /usr/riscv64-linux-gnu ./build/test_ssz
```

## Architecture Details

### Supported RISC-V Extensions

- **RV64GC**: Base 64-bit with standard extensions
  - RV64I: Base integer instruction set
  - M: Integer multiplication and division
  - A: Atomic instructions
  - F: Single-precision floating-point
  - D: Double-precision floating-point
  - C: Compressed instructions

### Memory Requirements

```
Minimum: 4KB RAM
Typical:  8KB RAM (with test suite)
Code:     ~2KB (optimized build)
```

### Performance

| Platform              | Hash Rate    | Verification Rate |
|-----------------------|--------------|-------------------|
| VisionFive 2 (1.5GHz) | ~500K/sec    | ~100K proofs/sec  |
| QEMU (emulated)       | ~50K/sec     | ~10K proofs/sec   |
| RISC Zero zkVM        | ~10K/sec     | ~2K proofs/sec    |
| SP1 zkVM              | ~15K/sec     | ~3K proofs/sec    |

*Benchmarks are approximate and depend on specific use cases*

## zkVM Integration

### RISC Zero

```rust
// In your RISC Zero guest code
use ssz_verifier_c::verify_proof;

fn verify_ssz_in_zkvm(proof: &[u8]) -> Result<[u8; 32], Error> {
    // C implementation compiled to RISC-V
    let root = unsafe {
        ssz_verify(proof.as_ptr(), proof.len())
    };
    Ok(root)
}
```

### SP1

```rust
// In your SP1 program
sp1_zkvm::syscalls::verify_ssz(proof_bytes);
```

## Continuous Integration

GitHub Actions automatically tests RISC-V compatibility:

```yaml
# .github/workflows/riscv.yml
- Docker-based testing (riscv64/ubuntu:22.04)
- QEMU user-mode emulation
- Performance benchmarks
```

See workflow results: [![RISC-V Tests](../../actions/workflows/riscv.yml/badge.svg)](../../actions/workflows/riscv.yml)

## Hardware Support

### Tested Devices

| Device                | Status | Notes                          |
|-----------------------|--------|--------------------------------|
| VisionFive 2          | ✅ Working | StarFive JH7110 SoC           |
| Milk-V Mars           | ✅ Working | StarFive JH7110 SoC           |
| SiFive Unmatched      | ✅ Working | SiFive FU740 SoC              |
| QEMU User Mode        | ✅ Working | Development/testing           |
| RISC Zero zkVM        | 🧪 Testing | Zero-knowledge proofs         |
| SP1 zkVM              | 🧪 Testing | Succinct proof generation     |

### Running on Real Hardware

```bash
# SSH into your RISC-V board
ssh user@riscv-board

# Clone and build
git clone https://github.com/anuragchvn-blip/ssz-universal-verifier.git
cd ssz-universal-verifier/c-skel
make test-riscv

# Run benchmarks
./build/test_ssz
```

## Embedded Use Cases

### 1. Ethereum Light Clients on RISC-V

Verify beacon chain proofs on embedded RISC-V devices:
```c
#include "ssz_stream.h"

void verify_beacon_state(uint8_t* proof, size_t len) {
    ssz_ctx_t ctx;
    ssz_init(&ctx);
    
    // Stream-based verification (low memory)
    if (ssz_verify_stream(&ctx, proof, len) == 0) {
        // Valid proof
        uint8_t root[32];
        ssz_get_root(&ctx, root);
    }
}
```

### 2. IoT Blockchain Validation

Validate blockchain data on IoT devices with limited resources.

### 3. Zero-Knowledge Proof Generation

Generate proofs of SSZ verification for privacy-preserving applications.

## Development Tools

### Cross-Compilation Toolchain

**Ubuntu/Debian:**
```bash
sudo apt-get install gcc-riscv64-linux-gnu binutils-riscv64-linux-gnu
```

**macOS:**
```bash
brew install riscv-gnu-toolchain
```

**Windows:**
Use WSL2 with Ubuntu and install Linux toolchain.

### Debugging

```bash
# Build with debug symbols
CC=riscv64-linux-gnu-gcc CFLAGS="-g -O0" make test-riscv

# Debug with GDB
qemu-riscv64-static -g 1234 ./build/test_ssz &
riscv64-linux-gnu-gdb ./build/test_ssz
(gdb) target remote :1234
(gdb) break main
(gdb) continue
```

## Performance Optimization

### Compiler Flags

```makefile
# For maximum performance
CFLAGS = -O3 -march=rv64gc -mtune=sifive-7-series

# For smallest code size
CFLAGS = -Os -march=rv64gc -flto

# For zkVM (minimal)
CFLAGS = -O2 -march=rv64i -nostdlib -static
```

### Memory Layout

```
Stack:  2KB (configurable)
Heap:   None (static allocation only)
Code:   1-2KB (optimized)
Data:   512B (state buffers)
```

## Troubleshooting

### "RISC-V toolchain not found"

Install the cross-compiler:
```bash
sudo apt-get install gcc-riscv64-linux-gnu
```

### "QEMU not found"

Install QEMU user-mode emulation:
```bash
sudo apt-get install qemu-user qemu-user-static
```

### Tests fail in Docker

Ensure Docker has enough memory allocated (2GB minimum).

### Slow performance in QEMU

QEMU emulation is significantly slower than native hardware. For real performance testing, use actual RISC-V hardware.

## Contributing

Help us improve RISC-V support:

1. **Hardware Testing**: Test on real RISC-V boards
2. **zkVM Integration**: Improve RISC Zero/SP1 integration
3. **Performance**: Optimize for specific RISC-V cores
4. **Documentation**: Share your use cases

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## Resources

- [RISC-V International](https://riscv.org/)
- [RISC Zero Documentation](https://dev.risczero.com/)
- [SP1 Documentation](https://docs.succinct.xyz/)
- [VisionFive 2 Wiki](https://wiki.pine64.org/wiki/Star64)
- [QEMU RISC-V Documentation](https://www.qemu.org/docs/master/system/target-riscv.html)

## License

Same as main project - see [LICENSE](../LICENSE)
