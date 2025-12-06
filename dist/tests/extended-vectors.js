"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../src/index.js");
/* Extended test vectors for comprehensive coverage */
let passed = 0;
let failed = 0;
function assert(cond, msg) {
    if (cond) {
        passed++;
    }
    else {
        console.error(`FAIL: ${msg}`);
        failed++;
    }
}
function hex(buf) {
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}
function fromHex(s) {
    const arr = new Uint8Array(s.length / 2);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = parseInt(s.substr(i * 2, 2), 16);
    }
    return arr;
}
// Type definitions
const uint8Type = { kind: index_js_1.TypeKind.Basic, fixedSize: 1 };
const uint16Type = { kind: index_js_1.TypeKind.Basic, fixedSize: 2 };
const uint32Type = { kind: index_js_1.TypeKind.Basic, fixedSize: 4 };
const uint64Type = { kind: index_js_1.TypeKind.Basic, fixedSize: 8 };
const uint256Type = { kind: index_js_1.TypeKind.Basic, fixedSize: 32 };
const bytes32Type = { kind: index_js_1.TypeKind.Basic, fixedSize: 32 };
console.log('=== Extended Test Suite: Basic Types ===\n');
// Test: All basic type sizes
{
    const data1 = new Uint8Array(1);
    data1[0] = 0xff;
    const res1 = (0, index_js_1.sszStreamRootFromSlice)(uint8Type, data1);
    assert('root' in res1, 'uint8(255) should succeed');
}
{
    const data = new Uint8Array(2);
    data[0] = 0xff;
    data[1] = 0xff;
    const res = (0, index_js_1.sszStreamRootFromSlice)(uint16Type, data);
    assert('root' in res, 'uint16(65535) should succeed');
}
{
    const data = new Uint8Array(4);
    data.fill(0xff);
    const res = (0, index_js_1.sszStreamRootFromSlice)(uint32Type, data);
    assert('root' in res, 'uint32(max) should succeed');
}
{
    const data = new Uint8Array(8);
    data.fill(0xff);
    const res = (0, index_js_1.sszStreamRootFromSlice)(uint64Type, data);
    assert('root' in res, 'uint64(max) should succeed');
}
{
    const data = new Uint8Array(32);
    data.fill(0xaa);
    const res = (0, index_js_1.sszStreamRootFromSlice)(uint256Type, data);
    assert('root' in res, 'uint256(0xaa...) should succeed');
}
console.log('=== Extended Test Suite: Bitlists ===\n');
// Test: Various single-byte bitlist lengths
const bitlistType = { kind: index_js_1.TypeKind.Bitlist };
{
    // Bitlist with 4 bits (from basic tests - known working)
    const data = fromHex('10');
    const res = (0, index_js_1.sszStreamRootFromSlice)(bitlistType, data);
    assert('root' in res, 'bitlist with 4 bits should succeed');
}
{
    // Bitlist with 5 bits
    const data = fromHex('20');
    const res = (0, index_js_1.sszStreamRootFromSlice)(bitlistType, data);
    assert('root' in res, 'bitlist with 5 bits should succeed');
}
{
    // Bitlist with 6 bits
    const data = fromHex('40');
    const res = (0, index_js_1.sszStreamRootFromSlice)(bitlistType, data);
    assert('root' in res, 'bitlist with 6 bits should succeed');
}
{
    // Bitlist with 7 bits
    const data = fromHex('80');
    const res = (0, index_js_1.sszStreamRootFromSlice)(bitlistType, data);
    assert('root' in res, 'bitlist with 7 bits should succeed');
}
console.log('=== Extended Test Suite: Lists ===\n');
// Test: Lists of various sizes
const listUint8 = { kind: index_js_1.TypeKind.List, elementType: uint8Type };
const listUint32 = { kind: index_js_1.TypeKind.List, elementType: uint32Type };
{
    // Empty list
    const data = new Uint8Array(0);
    const res = (0, index_js_1.sszStreamRootFromSlice)(listUint8, data);
    assert('root' in res, 'empty list<uint8> should succeed');
}
{
    // List with 10 uint8 elements
    const data = new Uint8Array(10);
    for (let i = 0; i < 10; i++)
        data[i] = i;
    const res = (0, index_js_1.sszStreamRootFromSlice)(listUint8, data);
    assert('root' in res, 'list<uint8>[10] should succeed');
}
{
    // List with 32 uint8 elements (exactly one chunk)
    const data = new Uint8Array(32);
    for (let i = 0; i < 32; i++)
        data[i] = i;
    const res = (0, index_js_1.sszStreamRootFromSlice)(listUint8, data);
    assert('root' in res, 'list<uint8>[32] should succeed');
}
{
    // List with 33 uint8 elements (spans two chunks)
    const data = new Uint8Array(33);
    for (let i = 0; i < 33; i++)
        data[i] = i & 0xff;
    const res = (0, index_js_1.sszStreamRootFromSlice)(listUint8, data);
    assert('root' in res, 'list<uint8>[33] should succeed');
}
{
    // List with 100 uint8 elements
    const data = new Uint8Array(100);
    for (let i = 0; i < 100; i++)
        data[i] = i & 0xff;
    const res = (0, index_js_1.sszStreamRootFromSlice)(listUint8, data);
    assert('root' in res, 'list<uint8>[100] should succeed');
}
{
    // List with 256 uint8 elements (power of 2)
    const data = new Uint8Array(256);
    for (let i = 0; i < 256; i++)
        data[i] = i;
    const res = (0, index_js_1.sszStreamRootFromSlice)(listUint8, data);
    assert('root' in res, 'list<uint8>[256] should succeed');
}
{
    // List with 1023 uint8 elements (non-power of 2)
    const data = new Uint8Array(1023);
    for (let i = 0; i < 1023; i++)
        data[i] = i & 0xff;
    const res = (0, index_js_1.sszStreamRootFromSlice)(listUint8, data);
    assert('root' in res, 'list<uint8>[1023] should succeed');
}
console.log('=== Extended Test Suite: Vectors ===\n');
// Test: Fixed-size vectors
const vectorUint64 = { kind: index_js_1.TypeKind.Vector, elementType: uint64Type };
{
    // Vector with 1 element
    const data = new Uint8Array(8);
    data[0] = 0x42;
    const res = (0, index_js_1.sszStreamRootFromSlice)(vectorUint64, data);
    assert('root' in res, 'vector<uint64,1> should succeed');
}
{
    // Vector with 4 elements
    const data = new Uint8Array(32);
    for (let i = 0; i < 4; i++) {
        data[i * 8] = i;
    }
    const res = (0, index_js_1.sszStreamRootFromSlice)(vectorUint64, data);
    assert('root' in res, 'vector<uint64,4> should succeed');
}
{
    // Vector with 16 elements (power of 2)
    const data = new Uint8Array(128);
    for (let i = 0; i < 16; i++) {
        data[i * 8] = i;
    }
    const res = (0, index_js_1.sszStreamRootFromSlice)(vectorUint64, data);
    assert('root' in res, 'vector<uint64,16> should succeed');
}
console.log('=== Extended Test Suite: Containers ===\n');
// Test: Simple containers
{
    // Container with 2 fixed fields
    const containerType = {
        kind: index_js_1.TypeKind.Container,
        fieldTypes: [
            { kind: index_js_1.TypeKind.Basic, fixedSize: 8 },
            { kind: index_js_1.TypeKind.Basic, fixedSize: 8 }
        ]
    };
    const data = new Uint8Array(16);
    data[0] = 0x01;
    data[8] = 0x02;
    const res = (0, index_js_1.sszStreamRootFromSlice)(containerType, data);
    assert('root' in res, 'container with 2 fixed fields should succeed');
}
{
    // Container with 4 fixed fields
    const containerType = {
        kind: index_js_1.TypeKind.Container,
        fieldTypes: [
            { kind: index_js_1.TypeKind.Basic, fixedSize: 8 },
            { kind: index_js_1.TypeKind.Basic, fixedSize: 8 },
            { kind: index_js_1.TypeKind.Basic, fixedSize: 8 },
            { kind: index_js_1.TypeKind.Basic, fixedSize: 8 }
        ]
    };
    const data = new Uint8Array(32);
    for (let i = 0; i < 4; i++)
        data[i * 8] = i;
    const res = (0, index_js_1.sszStreamRootFromSlice)(containerType, data);
    assert('root' in res, 'container with 4 fixed fields should succeed');
}
{
    // Container with 1 fixed + 1 variable field
    const containerType = {
        kind: index_js_1.TypeKind.Container,
        fieldTypes: [
            { kind: index_js_1.TypeKind.Basic, fixedSize: 8 },
            { kind: index_js_1.TypeKind.Basic, fixedSize: 0 }
        ]
    };
    const field1 = new Uint8Array(8);
    field1[0] = 0x42;
    const offset = new Uint8Array(4);
    offset[0] = 12; // offset to start of variable data
    const field2 = fromHex('aabbccdd');
    const data = new Uint8Array(16);
    data.set(field1, 0);
    data.set(offset, 8);
    data.set(field2, 12);
    const res = (0, index_js_1.sszStreamRootFromSlice)(containerType, data);
    assert('root' in res, 'container with 1 fixed + 1 variable field should succeed');
}
{
    // Container with 2 variable fields
    const containerType = {
        kind: index_js_1.TypeKind.Container,
        fieldTypes: [
            { kind: index_js_1.TypeKind.Basic, fixedSize: 0 },
            { kind: index_js_1.TypeKind.Basic, fixedSize: 0 }
        ]
    };
    const offset1 = new Uint8Array(4);
    offset1[0] = 8;
    const offset2 = new Uint8Array(4);
    offset2[0] = 12;
    const field1 = fromHex('aabb');
    const field2 = fromHex('ccddee');
    const data = new Uint8Array(15);
    data.set(offset1, 0);
    data.set(offset2, 4);
    data.set(field1, 8);
    data.set(field2, 12);
    const res = (0, index_js_1.sszStreamRootFromSlice)(containerType, data);
    assert('root' in res, 'container with 2 variable fields should succeed');
}
console.log('=== Extended Test Suite: Edge Cases ===\n');
// Test: Maximum values
{
    const data = new Uint8Array(8);
    data.fill(0xff);
    const res = (0, index_js_1.sszStreamRootFromSlice)(uint64Type, data);
    assert('root' in res, 'uint64 max value should succeed');
}
// Test: Bitlist edge cases
// Test: Large lists for merkleization depth
{
    // List with 2048 elements (tests deep merkle tree)
    const data = new Uint8Array(2048);
    for (let i = 0; i < 2048; i++)
        data[i] = i & 0xff;
    const res = (0, index_js_1.sszStreamRootFromSlice)(listUint8, data);
    assert('root' in res, 'list<uint8>[2048] should succeed');
}
{
    // List with 4096 elements
    const data = new Uint8Array(4096);
    for (let i = 0; i < 4096; i++)
        data[i] = i & 0xff;
    const res = (0, index_js_1.sszStreamRootFromSlice)(listUint8, data);
    assert('root' in res, 'list<uint8>[4096] should succeed');
}
console.log('\n=== Extended Test Suite: Negative Cases ===\n');
// Test: Wrong sizes
{
    const data = new Uint8Array(7); // should be 8
    const res = (0, index_js_1.sszStreamRootFromSlice)(uint64Type, data);
    assert('error' in res && res.error === index_js_1.SszError.NonCanonical, 'uint64 wrong size should fail');
}
{
    const data = new Uint8Array(9); // should be 8
    const res = (0, index_js_1.sszStreamRootFromSlice)(uint64Type, data);
    assert('error' in res && res.error === index_js_1.SszError.NonCanonical, 'uint64 extra byte should fail');
}
{
    const data = new Uint8Array(31); // should be 32
    const res = (0, index_js_1.sszStreamRootFromSlice)(bytes32Type, data);
    assert('error' in res && res.error === index_js_1.SszError.NonCanonical, 'bytes32 wrong size should fail');
}
// Test: Bitlist invalid padding
{
    // Sentinel is 0
    const data = fromHex('00');
    const res = (0, index_js_1.sszStreamRootFromSlice)(bitlistType, data);
    assert('error' in res && res.error === index_js_1.SszError.BitlistPadding, 'bitlist zero sentinel should fail');
}
{
    // Padding bits are not zero
    const data = fromHex('1f'); // 00011111 - padding should be 000
    const res = (0, index_js_1.sszStreamRootFromSlice)(bitlistType, data);
    assert('error' in res && res.error === index_js_1.SszError.BitlistPadding, 'bitlist non-zero padding should fail');
}
{
    // Multiple non-zero padding bits
    const data = fromHex('7f'); // 01111111
    const res = (0, index_js_1.sszStreamRootFromSlice)(bitlistType, data);
    assert('error' in res && res.error === index_js_1.SszError.BitlistPadding, 'bitlist multiple padding bits should fail');
}
// Test: List alignment issues
{
    // List with misaligned fixed-size elements
    const data = new Uint8Array(9); // Should be multiple of 8
    const res = (0, index_js_1.sszStreamRootFromSlice)({ kind: index_js_1.TypeKind.List, elementType: uint64Type }, data);
    assert('error' in res && res.error === index_js_1.SszError.NonCanonical, 'misaligned list should fail');
}
// Test: Container validation
{
    // Container too short for header
    const containerType = {
        kind: index_js_1.TypeKind.Container,
        fieldTypes: [
            { kind: index_js_1.TypeKind.Basic, fixedSize: 8 },
            { kind: index_js_1.TypeKind.Basic, fixedSize: 8 }
        ]
    };
    const data = new Uint8Array(10); // should be 16
    const res = (0, index_js_1.sszStreamRootFromSlice)(containerType, data);
    assert('error' in res && res.error === index_js_1.SszError.MalformedHeader, 'container too short should fail');
}
{
    // Container with offset pointing to header
    const containerType = {
        kind: index_js_1.TypeKind.Container,
        fieldTypes: [
            { kind: index_js_1.TypeKind.Basic, fixedSize: 8 },
            { kind: index_js_1.TypeKind.Basic, fixedSize: 0 }
        ]
    };
    const data = new Uint8Array(12);
    data[8] = 4; // offset points into header area
    const res = (0, index_js_1.sszStreamRootFromSlice)(containerType, data);
    assert('error' in res && res.error === index_js_1.SszError.BadOffset, 'offset into header should fail');
}
{
    // Container with offset beyond buffer
    const containerType = {
        kind: index_js_1.TypeKind.Container,
        fieldTypes: [
            { kind: index_js_1.TypeKind.Basic, fixedSize: 8 },
            { kind: index_js_1.TypeKind.Basic, fixedSize: 0 }
        ]
    };
    const data = new Uint8Array(12);
    data[8] = 100; // offset beyond buffer
    const res = (0, index_js_1.sszStreamRootFromSlice)(containerType, data);
    assert('error' in res && res.error === index_js_1.SszError.LengthOverflow, 'offset beyond buffer should fail');
}
console.log(`\n✅ Extended Tests: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
//# sourceMappingURL=extended-vectors.js.map