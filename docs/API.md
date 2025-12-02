# SSZ Universal Verifier - API Documentation

## Overview

The SSZ Universal Verifier provides a minimal, auditable API for computing SSZ merkle roots with strict canonical validation. Available in TypeScript, Rust, and C.

## TypeScript API

### Core Functions

#### `sszStreamRootFromSlice(td: TypeDesc, bytes: Uint8Array)`

Compute the SSZ merkle root from a complete byte array.

**Parameters:**
- `td: TypeDesc` - Type descriptor defining the SSZ structure
- `bytes: Uint8Array` - The serialized SSZ data

**Returns:**
- `{ root: Uint8Array }` - Success with 32-byte merkle root
- `{ error: SszError, msg: string }` - Validation error

**Example:**
```typescript
import { sszStreamRootFromSlice, TypeKind, SszError } from 'ssz-universal-verifier';

// uint64 example
const td = { kind: TypeKind.Basic, fixedSize: 8 };
const data = new Uint8Array(8);
data[0] = 0xff;

const result = sszStreamRootFromSlice(td, data);
if ('root' in result) {
  console.log('Root:', result.root);
} else {
  console.error('Error:', result.error, result.msg);
}
```

#### `sszStreamRootFromReader(td: TypeDesc, reader: (buf: Uint8Array) => number)`

Compute the SSZ merkle root from a streaming data source.

**Parameters:**
- `td: TypeDesc` - Type descriptor
- `reader: (buf: Uint8Array) => number` - Callback that fills buffer and returns bytes read (0 for EOF)

**Returns:**
- Same as `sszStreamRootFromSlice`

**Example:**
```typescript
let offset = 0;
const sourceData = new Uint8Array(100);

const reader = (buf: Uint8Array): number => {
  const remaining = sourceData.length - offset;
  if (remaining === 0) return 0;
  const toRead = Math.min(remaining, buf.length);
  buf.set(sourceData.subarray(offset, offset + toRead));
  offset += toRead;
  return toRead;
};

const result = sszStreamRootFromReader(td, reader);
```

### Type Descriptors

#### `TypeDesc` Interface

```typescript
interface TypeDesc {
  kind: TypeKind;
  fixedSize?: number;
  elementType?: TypeDesc;
  fieldTypes?: TypeDesc[];
}
```

#### `TypeKind` Enum

```typescript
enum TypeKind {
  Basic = 0,      // Fixed or variable-length byte sequences
  Vector = 1,     // Fixed-length list
  List = 2,       // Variable-length list
  Container = 3,  // Struct with multiple fields
  Bitlist = 4     // Variable-length bit array
}
```

### Type Descriptor Examples

#### Basic Types

```typescript
// uint8, uint16, uint32, uint64, uint128, uint256
const uint64: TypeDesc = { kind: TypeKind.Basic, fixedSize: 8 };
const uint256: TypeDesc = { kind: TypeKind.Basic, fixedSize: 32 };

// bytes32 (fixed-size bytes)
const bytes32: TypeDesc = { kind: TypeKind.Basic, fixedSize: 32 };

// bytes (variable-length)
const bytesVar: TypeDesc = { kind: TypeKind.Basic, fixedSize: 0 };
```

#### Bitlist

```typescript
// Bitlist (variable-length bit array with sentinel)
const bitlist: TypeDesc = { kind: TypeKind.Bitlist };

// Example data: 4 bits (0000) + sentinel = 0x10
const data = new Uint8Array([0x10]);
const result = sszStreamRootFromSlice(bitlist, data);
```

#### List

```typescript
// List<uint64>
const listUint64: TypeDesc = {
  kind: TypeKind.List,
  elementType: { kind: TypeKind.Basic, fixedSize: 8 }
};

// Empty list
const emptyData = new Uint8Array(0);
const result1 = sszStreamRootFromSlice(listUint64, emptyData);

// List with 2 uint64 elements
const listData = new Uint8Array(16);
listData[0] = 1; // First uint64 = 1
listData[8] = 2; // Second uint64 = 2
const result2 = sszStreamRootFromSlice(listUint64, listData);
```

#### Vector

```typescript
// Vector<uint64, 4> (fixed-length list of 4 elements)
const vectorUint64: TypeDesc = {
  kind: TypeKind.Vector,
  elementType: { kind: TypeKind.Basic, fixedSize: 8 }
};

// Must have exactly 4 uint64 elements (32 bytes)
const vectorData = new Uint8Array(32);
const result = sszStreamRootFromSlice(vectorUint64, vectorData);
```

#### Container

```typescript
// Container with fixed fields
const container: TypeDesc = {
  kind: TypeKind.Container,
  fieldTypes: [
    { kind: TypeKind.Basic, fixedSize: 8 },  // uint64
    { kind: TypeKind.Basic, fixedSize: 32 }  // bytes32
  ]
};

const containerData = new Uint8Array(40);
containerData[0] = 0xff; // First field
containerData[8] = 0xaa; // Second field starts at byte 8
const result = sszStreamRootFromSlice(container, containerData);
```

```typescript
// Container with variable field
const containerVar: TypeDesc = {
  kind: TypeKind.Container,
  fieldTypes: [
    { kind: TypeKind.Basic, fixedSize: 8 },  // uint64 (fixed)
    { kind: TypeKind.Basic, fixedSize: 0 }   // bytes (variable)
  ]
};

// Format: [fixed_field][offset][variable_data]
const offset = new Uint8Array(4);
offset[0] = 12; // Variable data starts at byte 12

const data = new Uint8Array(15);
data.set(new Uint8Array(8), 0);     // Fixed field (8 bytes)
data.set(offset, 8);                 // Offset pointer (4 bytes)
data.set(new Uint8Array([1,2,3]), 12); // Variable data (3 bytes)

const result = sszStreamRootFromSlice(containerVar, data);
```

### Error Codes

#### `SszError` Enum

```typescript
enum SszError {
  None = 0,
  BadOffset = 1,           // Offsets not strictly increasing or invalid
  NonCanonical = 2,        // Trailing bytes or encoding violation
  BitlistPadding = 3,      // Bitlist padding bits non-zero
  UnsupportedType = 4,     // Type not implemented or malformed
  MalformedHeader = 5,     // Insufficient bytes for header/offsets
  LengthOverflow = 6,      // Offset or length exceeds buffer
  UnexpectedEOF = 7        // Reader returned EOF mid-stream
}
```

### Validation Rules

The verifier enforces strict SSZ canonical encoding:

1. **Offset Validation**: All offsets must be strictly increasing and within buffer bounds
2. **Length Matching**: Fixed-size types must have exact byte lengths
3. **No Trailing Bytes**: No extra bytes allowed after valid data
4. **Bitlist Sentinel**: Must have exactly one sentinel bit (MSB) set to 1
5. **Bitlist Padding**: All bits between data and sentinel must be zero (in specific positions)
6. **Container Offsets**: Variable field offsets must point beyond fixed header
7. **List Alignment**: Fixed-element lists must align to element size

## Rust API

### Core Function

```rust
pub fn ssz_stream_root_from_slice(
    td: &TypeDesc,
    bytes: &[u8]
) -> Result<[u8; 32], SszError>
```

**Parameters:**
- `td: &TypeDesc` - Type descriptor reference
- `bytes: &[u8]` - Serialized SSZ data slice

**Returns:**
- `Ok([u8; 32])` - 32-byte merkle root
- `Err(SszError)` - Validation error

**Example:**
```rust
use ssz_stream::{ssz_stream_root_from_slice, TypeDesc, TypeKind};

let td = TypeDesc {
    kind: TypeKind::Basic,
    fixed_size: Some(8),
};
let data = [0u8; 8];

match ssz_stream_root_from_slice(&td, &data) {
    Ok(root) => println!("Root: {:?}", root),
    Err(e) => eprintln!("Error: {:?}", e),
}
```

### Type Descriptors

```rust
pub struct TypeDesc {
    pub kind: TypeKind,
    pub fixed_size: Option<usize>,
}

pub enum TypeKind {
    Basic,
    Vector,
    List,
    Container,
    Bitlist,
}

pub enum SszError {
    None,
    BadOffset,
    NonCanonical,
    BitlistPadding,
    UnsupportedType,
    MalformedHeader,
    LengthOverflow,
    UnexpectedEOF,
}
```

### Examples

#### Basic Types
```rust
// uint64
let td = TypeDesc { kind: TypeKind::Basic, fixed_size: Some(8) };
let data = [0xff, 0, 0, 0, 0, 0, 0, 0];
let root = ssz_stream_root_from_slice(&td, &data)?;
```

#### Bitlist
```rust
let td = TypeDesc { kind: TypeKind::Bitlist, fixed_size: None };
let data = [0x10]; // 4 bits + sentinel
let root = ssz_stream_root_from_slice(&td, &data)?;
```

#### List
```rust
let td = TypeDesc { kind: TypeKind::List, fixed_size: Some(8) };
let data = [1u8, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0];
let root = ssz_stream_root_from_slice(&td, &data)?;
```

### no_std Support

The Rust implementation supports `no_std` environments:

```rust
#![no_std]

extern crate alloc;
use alloc::vec::Vec;
```

## C API

### Core Function

```c
int ssz_stream_root_from_buffer(
    const uint8_t *bytes,
    size_t len,
    const TypeDesc *td,
    uint8_t out_root[32],
    char err[128]
);
```

**Parameters:**
- `bytes` - Input data buffer
- `len` - Buffer length
- `td` - Type descriptor pointer
- `out_root` - Output buffer for 32-byte root
- `err` - Error message buffer (128 bytes)

**Returns:**
- `SSZ_ERR_NONE` (0) - Success
- Error code (1-7) - See `SszError` enum

**Example:**
```c
#include "ssz_stream.h"

TypeDesc uint64_type = { .kind = SSZ_KIND_BASIC, .fixed_size = 8 };
uint8_t data[8] = {0xff, 0, 0, 0, 0, 0, 0, 0};
uint8_t root[32];
char err[128];

int status = ssz_stream_root_from_buffer(
    data, 8, &uint64_type, root, err
);

if (status == SSZ_ERR_NONE) {
    // Success: root contains 32-byte hash
} else {
    fprintf(stderr, "Error: %s\n", err);
}
```

### Type Descriptors

```c
typedef enum {
    SSZ_KIND_BASIC = 0,
    SSZ_KIND_VECTOR = 1,
    SSZ_KIND_LIST = 2,
    SSZ_KIND_CONTAINER = 3,
    SSZ_KIND_BITLIST = 4
} TypeKind;

typedef enum {
    SSZ_ERR_NONE = 0,
    SSZ_ERR_BAD_OFFSET = 1,
    SSZ_ERR_NON_CANONICAL = 2,
    SSZ_ERR_BITLIST_PADDING = 3,
    SSZ_ERR_UNSUPPORTED_TYPE = 4,
    SSZ_ERR_MALFORMED_HEADER = 5,
    SSZ_ERR_LENGTH_OVERFLOW = 6,
    SSZ_ERR_UNEXPECTED_EOF = 7
} SszError;

typedef struct {
    TypeKind kind;
    uint32_t fixed_size;
    const void* element_type;
    const void** field_types;
    uint32_t field_count;
    uint32_t max_length;
} TypeDesc;
```

## Performance Characteristics

### Time Complexity
- **Parsing**: O(n) where n = input bytes
- **Merkleization**: O(n/32) chunk hashing
- **Memory**: O(log n) stack depth for merkle tree

### Throughput (TypeScript with pure SHA-256)
- **Basic types**: 476K ops/sec (uint64)
- **Large lists**: 17-166 ops/sec (scales with size)
- **Overall**: ~1.3 MB/sec

**Note**: Using native SHA-256 (Node.js crypto, WASM, or hardware) provides 10-100x speedup.

### Memory Usage
- **Stack-based**: No dynamic allocation during merkleization
- **Incremental**: Processes data in 32-byte chunks
- **Streaming**: Constant memory for reader-based input

## Common Use Cases

### Ethereum Consensus Light Client

```typescript
// Verify a beacon block body
const blockBodyType: TypeDesc = {
  kind: TypeKind.Container,
  fieldTypes: [
    /* ... beacon block body fields ... */
  ]
};

const blockBodyBytes = /* ... from p2p network ... */;
const result = sszStreamRootFromSlice(blockBodyType, blockBodyBytes);

if ('root' in result) {
  // Compare with expected root from beacon block header
  const expectedRoot = /* ... from trusted source ... */;
  if (bytesEqual(result.root, expectedRoot)) {
    console.log('Block body verified!');
  }
}
```

### Validator Attestations

```typescript
// Bitlist representing validator participation
const attestationBitsType: TypeDesc = { kind: TypeKind.Bitlist };
const attestationData = /* ... from network ... */;

const result = sszStreamRootFromSlice(attestationBitsType, attestationData);
if ('root' in result) {
  // Use root in aggregate attestation verification
}
```

### Merkle Proof Verification

```typescript
// Verify a single value is part of a larger list
const listType: TypeDesc = {
  kind: TypeKind.List,
  elementType: { kind: TypeKind.Basic, fixedSize: 32 }
};

const fullList = /* ... complete list data ... */;
const result = sszStreamRootFromSlice(listType, fullList);

// Root can be used to verify merkle proofs for individual elements
```

## Integration with Other Libraries

### Node.js (with native crypto)

Replace pure TypeScript SHA-256 with Node.js crypto for better performance:

```typescript
import crypto from 'crypto';

// In src/hash.ts, replace sha256 implementation:
function sha256(data: Uint8Array): Uint8Array {
  return new Uint8Array(crypto.createHash('sha256').update(data).digest());
}
```

### WASM (future)

For browser environments, WASM build will provide near-native performance:

```javascript
import init, { sszStreamRoot } from './ssz_verifier.js';

await init();
const root = sszStreamRoot(typeDesc, dataBytes);
```

## Troubleshooting

### Common Errors

#### `NonCanonical: Basic type length mismatch`
- **Cause**: Input data length doesn't match `fixedSize`
- **Fix**: Ensure data is exactly `fixedSize` bytes

#### `BitlistPadding: Bitlist padding non-zero`
- **Cause**: Bits between data and sentinel are not zero
- **Fix**: Encode bitlist correctly with sentinel bit and zero padding

#### `BadOffset: Offsets not strictly increasing`
- **Cause**: Container/list offsets are malformed
- **Fix**: Ensure offsets point to valid positions and increase monotonically

#### `MalformedHeader: Container too short`
- **Cause**: Not enough bytes for container header
- **Fix**: Provide complete serialized data

### Debug Tips

1. **Validate input**: Check data length matches expected size
2. **Inspect bytes**: Use hex dump to verify encoding
3. **Test incrementally**: Start with simple types, build up complexity
4. **Compare with reference**: Use `@chainsafe/ssz` to verify expected roots
5. **Check offsets**: For containers/lists, manually verify offset table

## References

- [SSZ Specification](https://github.com/ethereum/consensus-specs/blob/dev/ssz/simple-serialize.md)
- [Ethereum Consensus Specs](https://github.com/ethereum/consensus-specs)
- [Merkleization](https://github.com/ethereum/consensus-specs/blob/dev/ssz/merkle-proofs.md)

## License

MIT - See LICENSE file for details
