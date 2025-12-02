# Integration Guide

## Quick Start

### TypeScript/Node.js

1. **Install dependencies:**
```bash
npm install
```

2. **Build the project:**
```bash
npm run build
```

3. **Run tests:**
```bash
npm test
```

4. **Use in your project:**
```typescript
import { sszStreamRootFromSlice, TypeKind } from './dist/src/index.js';

const td = { kind: TypeKind.Basic, fixedSize: 8 };
const data = new Uint8Array(8);
const result = sszStreamRootFromSlice(td, data);
console.log('Root:', result);
```

### Rust

1. **Add to Cargo.toml:**
```toml
[dependencies]
ssz-stream = { path = "./rust-skel" }
sha2 = { version = "0.10", default-features = false }
```

2. **Use in your code:**
```rust
use ssz_stream::{ssz_stream_root_from_slice, TypeDesc, TypeKind};

fn main() {
    let td = TypeDesc {
        kind: TypeKind::Basic,
        fixed_size: Some(8),
    };
    let data = [0u8; 8];
    
    match ssz_stream_root_from_slice(&td, &data) {
        Ok(root) => println!("Root: {:x?}", root),
        Err(e) => eprintln!("Error: {:?}", e),
    }
}
```

3. **Build:**
```bash
cd rust-skel
cargo build --release
```

4. **Run tests:**
```bash
cargo test --release
```

### C

1. **Build the library:**
```bash
cd c-skel
make
```

2. **Link in your project:**
```c
#include "ssz_stream.h"

int main() {
    TypeDesc td = { .kind = SSZ_KIND_BASIC, .fixed_size = 8 };
    uint8_t data[8] = {0};
    uint8_t root[32];
    char err[128];
    
    int status = ssz_stream_root_from_buffer(data, 8, &td, root, err);
    if (status == SSZ_ERR_NONE) {
        printf("Success!\n");
    }
    return 0;
}
```

## Cross-Language Compatibility

All implementations produce identical merkle roots for the same input:

```typescript
// TypeScript
const result = sszStreamRootFromSlice(td, data);
// Root: 0x1234...
```

```rust
// Rust
let root = ssz_stream_root_from_slice(&td, &data)?;
// Root: [0x12, 0x34, ...]
```

```c
// C
ssz_stream_root_from_buffer(data, len, &td, root, err);
// Root: {0x12, 0x34, ...}
```

## Integration with Ethereum Clients

### Light Client Example

```typescript
import { sszStreamRootFromSlice, TypeKind } from 'ssz-universal-verifier';

// Define beacon block body type
const beaconBlockBodyType = {
  kind: TypeKind.Container,
  fieldTypes: [
    { kind: TypeKind.Basic, fixedSize: 96 },  // randao_reveal
    { kind: TypeKind.Basic, fixedSize: 32 },  // eth1_data (simplified)
    // ... more fields
  ]
};

async function verifyBlock(blockBodyBytes: Uint8Array, expectedRoot: Uint8Array) {
  const result = sszStreamRootFromSlice(beaconBlockBodyType, blockBodyBytes);
  
  if ('error' in result) {
    throw new Error(`Validation failed: ${result.msg}`);
  }
  
  // Compare roots
  if (!bytesEqual(result.root, expectedRoot)) {
    throw new Error('Root mismatch');
  }
  
  console.log('Block verified successfully');
}
```

### Attestation Aggregation

```typescript
const attestationBitsType = { kind: TypeKind.Bitlist };

function processAttestation(attestationData: Uint8Array) {
  const result = sszStreamRootFromSlice(attestationBitsType, attestationData);
  
  if ('error' in result) {
    console.error('Invalid attestation bitlist');
    return null;
  }
  
  return result.root;
}
```

## Performance Optimization

### TypeScript: Replace SHA-256

For production use, replace pure TypeScript SHA-256 with native implementation:

**Option 1: Node.js crypto**
```typescript
// src/hash.ts
import crypto from 'crypto';

export function hashLeaf(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(crypto.createHash('sha256').update(bytes).digest());
}

export function hashParent(left: Uint8Array, right: Uint8Array): Uint8Array {
  const hasher = crypto.createHash('sha256');
  hasher.update(left);
  hasher.update(right);
  return new Uint8Array(hasher.digest());
}
```

**Expected speedup**: 10-50x faster

**Option 2: WASM (future)**
```typescript
import { sha256 } from '@noble/hashes/sha256';

export function hashLeaf(bytes: Uint8Array): Uint8Array {
  return sha256(bytes);
}
```

### Rust: Optimizations

Already optimized with:
- `opt-level = "z"` for size
- `lto = true` for link-time optimization
- `codegen-units = 1` for better optimization

For maximum speed:
```toml
[profile.release]
opt-level = 3
lto = "fat"
codegen-units = 1
```

### C: Compiler Flags

```bash
gcc -O3 -march=native -flto -o ssz_verifier src/*.c
```

## Error Handling Patterns

### TypeScript: Result Type

```typescript
function processSSZ(data: Uint8Array) {
  const result = sszStreamRootFromSlice(td, data);
  
  if ('error' in result) {
    switch (result.error) {
      case SszError.NonCanonical:
        console.error('Invalid encoding:', result.msg);
        break;
      case SszError.BadOffset:
        console.error('Malformed container:', result.msg);
        break;
      default:
        console.error('Validation error:', result.msg);
    }
    return null;
  }
  
  return result.root;
}
```

### Rust: Result Type

```rust
fn process_ssz(data: &[u8]) -> Result<[u8; 32], String> {
    ssz_stream_root_from_slice(&td, data)
        .map_err(|e| match e {
            SszError::NonCanonical => "Invalid encoding".to_string(),
            SszError::BadOffset => "Malformed container".to_string(),
            _ => format!("Validation error: {:?}", e),
        })
}
```

### C: Status Codes

```c
int status = ssz_stream_root_from_buffer(data, len, &td, root, err);

switch (status) {
    case SSZ_ERR_NONE:
        // Success
        break;
    case SSZ_ERR_NON_CANONICAL:
        fprintf(stderr, "Invalid encoding: %s\n", err);
        break;
    case SSZ_ERR_BAD_OFFSET:
        fprintf(stderr, "Malformed container: %s\n", err);
        break;
    default:
        fprintf(stderr, "Error: %s\n", err);
}
```

## Testing Your Integration

### Validate Against Reference Implementation

```typescript
import { sszStreamRootFromSlice } from 'ssz-universal-verifier';
import { ContainerType, UintNumberType } from '@chainsafe/ssz';

// Reference implementation
const sszType = new ContainerType({
  a: new UintNumberType(8),
  b: new UintNumberType(8),
});

const value = { a: 1n, b: 2n };
const serialized = sszType.serialize(value);
const expectedRoot = sszType.hashTreeRoot(value);

// Your implementation
const td = {
  kind: TypeKind.Container,
  fieldTypes: [
    { kind: TypeKind.Basic, fixedSize: 8 },
    { kind: TypeKind.Basic, fixedSize: 8 },
  ]
};

const result = sszStreamRootFromSlice(td, serialized);
assert('root' in result);
assert(bytesEqual(result.root, expectedRoot));
```

### Cross-Language Validation

Create test vectors that work across all implementations:

```json
{
  "test_uint64_zero": {
    "type": {"kind": "Basic", "fixedSize": 8},
    "data": "0x0000000000000000",
    "expected_root": "0x0000000000000000000000000000000000000000000000000000000000000000"
  },
  "test_uint64_max": {
    "type": {"kind": "Basic", "fixedSize": 8},
    "data": "0xffffffffffffffff",
    "expected_root": "0xffffffffffffffff000000000000000000000000000000000000000000000000"
  }
}
```

Load and verify in each language to ensure consistency.

## Common Integration Patterns

### Batch Processing

```typescript
async function processBatch(items: Uint8Array[]) {
  const results = [];
  
  for (const item of items) {
    const result = sszStreamRootFromSlice(td, item);
    if ('root' in result) {
      results.push(result.root);
    } else {
      console.error('Failed:', result.msg);
    }
  }
  
  return results;
}
```

### Streaming Large Files

```typescript
import fs from 'fs';

function streamFileToSSZ(filePath: string) {
  let buffer = Buffer.alloc(0);
  const stream = fs.createReadStream(filePath);
  
  const reader = (buf: Uint8Array) => {
    if (buffer.length === 0) {
      const chunk = stream.read();
      if (chunk === null) return 0;
      buffer = chunk;
    }
    
    const toRead = Math.min(buffer.length, buf.length);
    buf.set(buffer.slice(0, toRead));
    buffer = buffer.slice(toRead);
    return toRead;
  };
  
  return sszStreamRootFromReader(td, reader);
}
```

### Parallel Processing (Worker Threads)

```typescript
import { Worker } from 'worker_threads';

function processInWorker(data: Uint8Array): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js');
    
    worker.on('message', (root) => resolve(root));
    worker.on('error', reject);
    
    worker.postMessage({ td, data });
  });
}
```

## Deployment Checklist

- [ ] Replace pure TypeScript SHA-256 with native implementation
- [ ] Enable production optimizations in build config
- [ ] Add comprehensive error logging
- [ ] Implement retry logic for transient errors
- [ ] Monitor performance metrics (throughput, latency)
- [ ] Set up alerts for validation failures
- [ ] Test with production-sized data
- [ ] Validate against canonical test vectors
- [ ] Document expected performance characteristics
- [ ] Plan for graceful degradation on errors

## Support

For issues or questions:
- GitHub Issues: [anuragchvn-blip/ssz-universal-verifier](https://github.com/anuragchvn-blip/ssz-universal-verifier)
- Ethereum SSZ Spec: [ethereum/consensus-specs](https://github.com/ethereum/consensus-specs)
