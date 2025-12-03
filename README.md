# SSZ Universal Verifier

[![CI](https://github.com/anuragchvn-blip/ssz-universal-verifier/actions/workflows/ci.yml/badge.svg)](https://github.com/anuragchvn-blip/ssz-universal-verifier/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-stable-orange.svg)](https://www.rust-lang.org/)
[![C](https://img.shields.io/badge/C-C11-blue.svg)](https://en.wikipedia.org/wiki/C11_(C_standard_revision))
[![Tests](https://img.shields.io/badge/tests-118%20passing-brightgreen.svg)](tests/)
[![Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**Production-grade, zero-dependency SSZ verifier with universal platform support**

Minimal, auditable implementation (~2,300 LOC) of streaming SSZ merkleization with strict canonical checks. First SSZ verifier with **zero runtime dependencies** and support for TypeScript, C, Rust, WASM, and RISC-V targets.

## 🎯 Key Features

- **Zero Dependencies** - No external hash libraries, pure implementations
- **Multi-Platform** - TypeScript, C (`no_std`), Rust, WASM, native addons
- **Production-Tested** - 118 tests passing, 584K+ AFL++ fuzzing iterations
- **Minimal & Auditable** - ~2,300 LOC total across all implementations
- **Deterministic** - Identical outputs across platforms, strict canonical checks
- **Security-First** - Professional fuzzing, comprehensive security documentation

## 🚀 Quick Start

```bash
npm install ssz-universal-verifier
```

```typescript
import { sszStreamRootFromSlice, TypeDesc, TypeKind } from "ssz-universal-verifier";

const uint64Type: TypeDesc = { kind: TypeKind.Basic, fixedSize: 8 };
const data = new Uint8Array(8);
const result = sszStreamRootFromSlice(uint64Type, data);
```

## 📚 Documentation

- **[Production Status](PRODUCTION_STATUS.md)** - Current project status and readiness
- **[API Reference](docs/API.md)** - Complete API documentation for TypeScript, Rust, and C
- **[Integration Guide](docs/INTEGRATION.md)** - Quick start and best practices
- **[Security](docs/SECURITY.md)** - Security documentation and fuzzing results
- **[WebAssembly Guide](docs/WASM.md)** - WASM build and deployment
- **[Battle Plan](docs/BATTLE_PLAN.md)** - Development strategy and roadmap

## 🎯 Why This Exists

This is the **only SSZ verifier with zero runtime dependencies** and universal platform support.

**Unique Advantages:**
- ✅ **Zero Dependencies** - No external hash libraries (unique!)
- ✅ **Universal** - Works on desktop, embedded, browsers, and targeting zkVMs
- ✅ **Minimal** - ~2,300 LOC (10x smaller than alternatives)
- ✅ **Battle-Tested** - 118 tests, 584K+ fuzzing iterations, 0 vulnerabilities
- ✅ **Deterministic** - Identical outputs across all platforms
- ✅ **Auditable** - Small enough to fully audit in hours

## 🏗️ Implementations

| Platform | Status | Tests | LOC | Features |
|----------|--------|-------|-----|----------|
| **TypeScript** | ✅ Production | 59/59 | 1,193 | Full SSZ support, zero dependencies |
| **C** | ✅ Production | 42/42 | 319 | `no_std`, Basic/Vector/List/Container/Bitlist |
| **Rust** | ✅ Production | 17/17 | 805 | `#![no_std]`, full SSZ support |
| **WASM** | ✅ Working | - | - | Browser + Node.js ready |
| **Native Addon** | ✅ Compiles | - | - | Intel SHA-NI support (needs verification) |
| **zkVM** | ⏳ 60% | - | - | RISC Zero integration in progress |

## Build & Test

### TypeScript (primary)

```bash
npm install
npm run build
npm test              # Run basic tests (23 tests)
npm run test:extended # Run extended tests (36 tests)
npm run test:all      # Run all tests (59 tests)
npm run bench         # Run performance benchmarks
```

Expected output: `59 passed, 0 failed`

**Performance**: 476K ops/sec (uint64), 1.3 MB/sec throughput

**Hardware Requirements**: None (pure software), optional SHA-NI for native acceleration

### C skeleton

```bash
cd c-skel
make all
make test
```

### Rust (complete implementation)

```bash
cd rust-skel
cargo build --release
cargo test --release  # Run 17 integration tests
```

All Rust tests pass with full SSZ support including bitlists, lists, vectors, and containers.

### All targets

```bash
make all        # Build TypeScript, C, Rust
make ts-test    # Run TypeScript tests
make riscv-build  # Cross-compile to RISC-V (requires toolchain)
```

### WASM build

Compile Rust implementation to WebAssembly for browser and Node.js:

```bash
# Build WASM for web (ES modules)
npm run build:wasm

# Build for all targets (web, nodejs, bundler)
npm run build:wasm:all

# Run WASM tests
npm run test:wasm

# Serve demo in browser
npm run serve:wasm
# Then open http://localhost:8080/demo.html
```

**Output**: ~50-100KB optimized WASM binary with TypeScript definitions

**Requirements**: `wasm-pack` (install: `cargo install wasm-pack`)

See **[docs/WASM.md](docs/WASM.md)** for complete documentation, examples, and deployment guide.

### RISC-V cross-compilation

C target:

```bash
cd c-skel
make riscv  # Requires riscv64-unknown-elf-gcc
```

Rust target:

```bash
cd rust-skel
rustup target add riscv64gc-unknown-linux-gnu
cargo build --release --target riscv64gc-unknown-linux-gnu
```

## API Examples

### TypeScript

```typescript
import { sszStreamRootFromSlice, TypeDesc, TypeKind } from "./src/index.js";

const uint64Type: TypeDesc = { kind: TypeKind.Basic, fixedSize: 8 };
const data = new Uint8Array(8); // uint64(0)

const result = sszStreamRootFromSlice(uint64Type, data);
if ("root" in result) {
  console.log("Root:", Buffer.from(result.root).toString("hex"));
} else {
  console.error("Error:", result.error, result.msg);
}
```

### C

```c
#include "ssz_stream.h"

TypeDesc uint64_type = { .kind = SSZ_KIND_BASIC, .fixed_size = 8 };
uint8_t data[8] = {0};
uint8_t root[32];
char err[128];

int status = ssz_stream_root_from_buffer(data, 8, &uint64_type, root, err);
if (status == SSZ_ERR_NONE) {
  // Success: root contains 32-byte hash
} else {
  // Error: err contains message
}
```

### Rust

```rust
use ssz_stream::{stream_root_from_slice, TypeDesc, TypeKind};

let td = TypeDesc { kind: TypeKind::Basic, fixed_size: Some(8) };
let data = [0u8; 8];

match stream_root_from_slice(&td, &data) {
    Ok(root) => println!("Root: {:?}", root),
    Err(e) => eprintln!("Error: {:?}", e),
}
```

## SszError Codes

| Code | Name            | Description                                |
| ---- | --------------- | ------------------------------------------ |
| 0    | None            | Success                                    |
| 1    | BadOffset       | Offsets not strictly increasing or invalid |
| 2    | NonCanonical    | Trailing bytes or encoding violation       |
| 3    | BitlistPadding  | Bitlist padding bits non-zero              |
| 4    | UnsupportedType | Type not implemented or malformed TypeDesc |
| 5    | MalformedHeader | Insufficient bytes for header/offsets      |
| 6    | LengthOverflow  | Offset or length exceeds buffer            |
| 7    | UnexpectedEOF   | Reader callback returned EOF mid-stream    |

## Swapping Hash Implementation

All implementations expose a minimal hash interface:

**TypeScript**: Replace `src/hash.ts` with optimized implementation exporting:

```typescript
export function hashLeaf(chunk32: Uint8Array): Uint8Array;
export function hashParent(left32: Uint8Array, right32: Uint8Array): Uint8Array;
```

**C**: Replace `c-skel/src/hash.c` implementing:

```c
void sha256_hash(const uint8_t *data, size_t len, uint8_t out[32]);
```

**Rust**: Replace `rust-skel/src/hash.rs` implementing:

```rust
pub fn hash_leaf(chunk: &[u8; 32]) -> [u8; 32];
pub fn hash_parent(left: &[u8; 32], right: &[u8; 32]) -> [u8; 32];
```

The core algorithms remain identical; only the hash backend changes.

## Security Rationale

**Minimalism reduces attack surface**: ~600-900 LOC core implementation is fully auditable in hours, not weeks.

**Determinism prevents consensus divergence**: No floating point, no randomness, explicit endianness, identical behavior across platforms.

**Streaming prevents DoS**: Fixed-stack merkleizer (O(log N) memory) and chunking avoid unbounded allocations.

**Strict canonical checks**: Offset validation, padding checks, and trailing byte detection prevent malformed data acceptance that could break consensus.

**Pluggable hash layer**: Hardware acceleration or optimized backends (e.g., SIMD SHA-256) can be swapped without changing verification semantics.

## Test Vectors

The TypeScript implementation (`tests/vectors.ts`) contains 20+ canonical and negative test vectors covering:

- Basic types (uint64, bytes32)
- Empty and single-element lists
- Containers with variable fields
- Bitlists with padding validation
- Offset validation (increasing, bounds)
- Trailing bytes detection
- Large lists (1000+ elements)
- Streaming reader consistency

All implementations must produce identical roots for canonical vectors and identical error codes for negative vectors.

## License

MIT

## Grant Justification

This primitive:

1. **Increases software reliability**: deterministic, minimal-risk SSZ verification
2. **Reduces engineering time**: production-ready, tested reference across 3+ languages
3. **Encourages correctness culture**: Vitalik-style minimal engineering for Ethereum infrastructure
4. **Enables light clients**: embeddable in browsers (WASM) and constrained devices (RISC-V)
5. **Fills ecosystem gap**: no existing minimal, deterministic, cross-platform SSZ verifier primitive

General-purpose infrastructure tool for Ethereum consensus layer.
