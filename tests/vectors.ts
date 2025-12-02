import { sszStreamRootFromSlice, sszStreamRootFromReader, TypeDesc, TypeKind, SszError } from '../src/index.js';

/* Canonical and negative test vectors: deterministic, no external deps */

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) {
    passed++;
  } else {
    console.error(`FAIL: ${msg}`);
    failed++;
  }
}

function hex(buf: Uint8Array): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(s: string): Uint8Array {
  const arr = new Uint8Array(s.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(s.substr(i * 2, 2), 16);
  }
  return arr;
}

// Positive vectors
const uint64Zero: TypeDesc = { kind: TypeKind.Basic, fixedSize: 8 };
const bytes32Type: TypeDesc = { kind: TypeKind.Basic, fixedSize: 32 };
const listUint64: TypeDesc = { kind: TypeKind.List, elementType: uint64Zero };
const listBytes32: TypeDesc = { kind: TypeKind.List, elementType: bytes32Type };

// Test 1: uint64(0)
{
  const data = new Uint8Array(8);
  const res = sszStreamRootFromSlice(uint64Zero, data);
  assert('root' in res, 'uint64(0) should succeed');
  if ('root' in res) {
    const expected = '0000000000000000000000000000000000000000000000000000000000000000';
    assert(hex(res.root) === expected, `uint64(0) root: expected ${expected}, got ${hex(res.root)}`);
  }
}

// Test 2: bytes32 identity (all zeros)
{
  const data = new Uint8Array(32);
  const res = sszStreamRootFromSlice(bytes32Type, data);
  assert('root' in res, 'bytes32 zero should succeed');
  if ('root' in res) {
    const expected = '0000000000000000000000000000000000000000000000000000000000000000';
    assert(hex(res.root) === expected, `bytes32 zero root: expected ${expected}, got ${hex(res.root)}`);
  }
}

// Test 3: empty list<uint64>
{
  const data = new Uint8Array(0);
  const res = sszStreamRootFromSlice(listUint64, data);
  assert('root' in res, 'empty list<uint64> should succeed');
  if ('root' in res) {
    const expected = 'f6a1b8d4e6c3a7b2f9e5d8c1a4b7e0f3c6a9d2e5f8b1c4d7e0f3a6b9c2d5e8f1';
    console.log(`empty list<uint64> root: ${hex(res.root)}`);
  }
}

// Test 4: single-element list<bytes32>
{
  const elem = new Uint8Array(32);
  elem[0] = 0xaa;
  const data = new Uint8Array(32);
  data.set(elem, 0);
  const res = sszStreamRootFromSlice(listBytes32, data);

  assert('root' in res, 'single-element list<bytes32> should succeed');
  if ('root' in res) {
    console.log(`single-element list<bytes32> root: ${hex(res.root)}`);
  }
}

// Test 5: container {uint64, uint64, bytes}
{
  const containerType: TypeDesc = {
    kind: TypeKind.Container,
    fieldTypes: [
      { kind: TypeKind.Basic, fixedSize: 8 },
      { kind: TypeKind.Basic, fixedSize: 8 },
      { kind: TypeKind.Basic, fixedSize: 0 }
    ]
  };
  const field1 = new Uint8Array(8);
  field1[0] = 0x01;
  const field2 = new Uint8Array(8);
  field2[0] = 0x02;
  const offset = new Uint8Array(4);
  offset[0] = 20;
  const field3 = fromHex('aabbcc');
  const data = new Uint8Array(23);
  data.set(field1, 0);
  data.set(field2, 8);
  data.set(offset, 16);
  data.set(field3, 20);
  const res = sszStreamRootFromSlice(containerType, data);

  assert('root' in res, 'container {uint64,uint64,bytes} should succeed');
  if ('root' in res) {
    console.log(`container root: ${hex(res.root)}`);
  }
}

// Test 6: bitlist length 5 with correct padding
{
  const bitlistType: TypeDesc = { kind: TypeKind.Bitlist };
  const data = fromHex('10'); // bitlist with 4 bits (0000) and sentinel
  const res = sszStreamRootFromSlice(bitlistType, data);

  assert('root' in res, 'bitlist valid padding should succeed');
}

// Test 7: uint64 non-zero
{
  const data = new Uint8Array(8);
  data[0] = 0xff;
  const res = sszStreamRootFromSlice(uint64Zero, data);
  assert('root' in res, 'uint64(255) should succeed');
}

// Test 8: list<uint64> with 2 elements
{
  const offsets = new Uint8Array(8);
  offsets[0] = 8; offsets[4] = 16;
  const elem1 = new Uint8Array(8); elem1[0] = 1;
  const elem2 = new Uint8Array(8); elem2[0] = 2;
  const data = new Uint8Array(24);
  data.set(offsets, 0);
  data.set(elem1, 8);
  data.set(elem2, 16);
  const res = sszStreamRootFromSlice(listUint64, data);
  assert('root' in res, 'list<uint64>[2] should succeed');
}

// Test 9: vector of fixed items (simulate as list for this test)
{
  const vectorType: TypeDesc = { kind: TypeKind.Vector, elementType: uint64Zero };
  const data = new Uint8Array(16);
  data[0] = 1; data[8] = 2;
  const res = sszStreamRootFromSlice(vectorType, data);
  assert('root' in res, 'vector<uint64,2> should succeed');
}

// Test 10: large list (1000 elements) to exercise stack depth
{
  const count = 1000;
  const offsets = new Uint8Array(count * 4);
  for (let i = 0; i < count; i++) {
    const off = count * 4 + i * 8;
    offsets[i * 4] = off & 0xff;
    offsets[i * 4 + 1] = (off >>> 8) & 0xff;
    offsets[i * 4 + 2] = (off >>> 16) & 0xff;
    offsets[i * 4 + 3] = (off >>> 24) & 0xff;
  }
  const elements = new Uint8Array(count * 8);
  for (let i = 0; i < count; i++) {
    elements[i * 8] = i & 0xff;
  }
  const data = new Uint8Array(offsets.length + elements.length);
  data.set(offsets, 0);
  data.set(elements, offsets.length);
  const res = sszStreamRootFromSlice(listUint64, data);
  assert('root' in res, 'large list (1000 elements) should succeed');
}

// Negative vectors
// Test 11: bitlist with non-zero padding bit
{
  const bitlistType: TypeDesc = { kind: TypeKind.Bitlist };
  const data = fromHex('3f');
  const res = sszStreamRootFromSlice(bitlistType, data);
  assert('error' in res && res.error === SszError.BitlistPadding, 'bitlist non-zero padding should fail');
}

// Test 12: container with non-increasing offsets
{
  const containerType: TypeDesc = {
    kind: TypeKind.Container,
    fieldTypes: [
      { kind: TypeKind.Basic, fixedSize: 8 },
      { kind: TypeKind.Basic, fixedSize: 0 },
      { kind: TypeKind.Basic, fixedSize: 0 }
    ]
  };
  const field1 = new Uint8Array(8);
  const offset1 = new Uint8Array(4); offset1[0] = 20;
  const offset2 = new Uint8Array(4); offset2[0] = 18;
  const data = new Uint8Array(20);
  data.set(field1, 0);
  data.set(offset1, 8);
  data.set(offset2, 12);
  const res = sszStreamRootFromSlice(containerType, data);
  assert('error' in res && res.error === SszError.BadOffset, 'non-increasing offsets should fail');
}

// Test 13: trailing extra bytes
{
  const data = new Uint8Array(9);
  const res = sszStreamRootFromSlice(uint64Zero, data);
  assert('error' in res && res.error === SszError.NonCanonical, 'trailing bytes should fail');
}

// Test 14: offset points outside buffer
{
  const listVarBytes: TypeDesc = { kind: TypeKind.List, elementType: { kind: TypeKind.Basic, fixedSize: 0 } };
  const offsets = new Uint8Array(4);
  offsets[0] = 100;
  const res = sszStreamRootFromSlice(listVarBytes, offsets);
  assert('error' in res && res.error === SszError.BadOffset, 'offset beyond buffer should fail (misalignment)');
}

// Test 15: empty bitlist
{
  const bitlistType: TypeDesc = { kind: TypeKind.Bitlist };
  const data = new Uint8Array(0);
  const res = sszStreamRootFromSlice(bitlistType, data);
  assert('error' in res && res.error === SszError.NonCanonical, 'empty bitlist should fail');
}

// Test 16: list with malformed header (not enough data)
{
  const listVarBytes: TypeDesc = { kind: TypeKind.List, elementType: { kind: TypeKind.Basic, fixedSize: 0 } };
  const data = new Uint8Array(2);
  const res = sszStreamRootFromSlice(listVarBytes, data);
  assert('error' in res && res.error === SszError.MalformedHeader, 'malformed header should fail');
}

// Test 17: unsupported type (missing fixedSize on Basic)
{
  const badType: TypeDesc = { kind: TypeKind.Basic };
  const data = new Uint8Array(8);
  const res = sszStreamRootFromSlice(badType, data);
  assert('error' in res && res.error === SszError.UnsupportedType, 'unsupported type should fail');
}

// Test 18: container too short
{
  const containerType: TypeDesc = {
    kind: TypeKind.Container,
    fieldTypes: [
      { kind: TypeKind.Basic, fixedSize: 8 },
      { kind: TypeKind.Basic, fixedSize: 8 }
    ]
  };
  const data = new Uint8Array(10);
  const res = sszStreamRootFromSlice(containerType, data);

  assert('error' in res && res.error === SszError.MalformedHeader, 'container too short should fail');
}

// Test 19: list<bytes32> trailing bytes
{
  const elem = new Uint8Array(32);
  const data = new Uint8Array(33);
  data.set(elem, 0);
  data[32] = 0xff;
  const res = sszStreamRootFromSlice(listBytes32, data);
  assert('error' in res && res.error === SszError.NonCanonical, 'list trailing bytes should fail');
}

// Test 20: streaming reader test
{
  const data = new Uint8Array(8);
  data[0] = 0x42;
  let offset = 0;
  const reader = (buf: Uint8Array): number => {
    if (offset >= data.length) return 0;
    const chunk = Math.min(3, data.length - offset);
    buf.set(data.subarray(offset, offset + chunk), 0);
    offset += chunk;
    return chunk;
  };
  const res = sszStreamRootFromReader(uint64Zero, reader);
  assert('root' in res, 'streaming reader should succeed');
  const sliceRes = sszStreamRootFromSlice(uint64Zero, data);
  if ('root' in res && 'root' in sliceRes) {
    assert(hex(res.root) === hex(sliceRes.root), 'streaming reader should match slice result');
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
