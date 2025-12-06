"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../src/index.js");
function benchmark(name, iterations, fn) {
    // Warmup
    for (let i = 0; i < Math.min(100, iterations); i++) {
        fn();
    }
    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
        fn();
    }
    const end = Date.now();
    const totalMs = end - start;
    return {
        name,
        operations: iterations,
        totalMs,
        opsPerSec: Math.round((iterations / totalMs) * 1000),
        avgMs: totalMs / iterations
    };
}
function printResult(result) {
    console.log(`  ${result.name}:`);
    console.log(`    ${result.operations.toLocaleString()} operations in ${result.totalMs}ms`);
    console.log(`    ${result.opsPerSec.toLocaleString()} ops/sec`);
    console.log(`    ${result.avgMs.toFixed(4)}ms average\n`);
}
console.log('=== SSZ Universal Verifier Benchmarks ===\n');
// Type definitions
const uint64Type = { kind: index_js_1.TypeKind.Basic, fixedSize: 8 };
const bytes32Type = { kind: index_js_1.TypeKind.Basic, fixedSize: 32 };
const listUint64 = { kind: index_js_1.TypeKind.List, elementType: uint64Type };
console.log('--- Basic Types ---\n');
// Benchmark: uint64
{
    const data = new Uint8Array(8);
    data[0] = 0x42;
    const result = benchmark('uint64 root computation', 10000, () => {
        (0, index_js_1.sszStreamRootFromSlice)(uint64Type, data);
    });
    printResult(result);
}
// Benchmark: bytes32
{
    const data = new Uint8Array(32);
    data.fill(0xaa);
    const result = benchmark('bytes32 root computation', 10000, () => {
        (0, index_js_1.sszStreamRootFromSlice)(bytes32Type, data);
    });
    printResult(result);
}
console.log('--- Lists ---\n');
// Benchmark: Small list (10 elements)
{
    const data = new Uint8Array(80); // 10 x 8 bytes
    for (let i = 0; i < 10; i++) {
        data[i * 8] = i;
    }
    const result = benchmark('list<uint64>[10] root computation', 5000, () => {
        (0, index_js_1.sszStreamRootFromSlice)(listUint64, data);
    });
    printResult(result);
}
// Benchmark: Medium list (100 elements)
{
    const data = new Uint8Array(800); // 100 x 8 bytes
    for (let i = 0; i < 100; i++) {
        data[i * 8] = i & 0xff;
    }
    const result = benchmark('list<uint64>[100] root computation', 1000, () => {
        (0, index_js_1.sszStreamRootFromSlice)(listUint64, data);
    });
    printResult(result);
}
// Benchmark: Large list (1000 elements)
{
    const data = new Uint8Array(8000); // 1000 x 8 bytes
    for (let i = 0; i < 1000; i++) {
        data[i * 8] = i & 0xff;
    }
    const result = benchmark('list<uint64>[1000] root computation', 100, () => {
        (0, index_js_1.sszStreamRootFromSlice)(listUint64, data);
    });
    printResult(result);
}
// Benchmark: Very large list (10000 elements)
{
    const data = new Uint8Array(80000); // 10000 x 8 bytes
    for (let i = 0; i < 10000; i++) {
        data[i * 8] = i & 0xff;
    }
    const result = benchmark('list<uint64>[10000] root computation', 10, () => {
        (0, index_js_1.sszStreamRootFromSlice)(listUint64, data);
    });
    printResult(result);
}
console.log('--- Containers ---\n');
// Benchmark: Simple container
{
    const containerType = {
        kind: index_js_1.TypeKind.Container,
        fieldTypes: [
            { kind: index_js_1.TypeKind.Basic, fixedSize: 8 },
            { kind: index_js_1.TypeKind.Basic, fixedSize: 8 },
            { kind: index_js_1.TypeKind.Basic, fixedSize: 32 }
        ]
    };
    const data = new Uint8Array(48);
    data[0] = 0x01;
    data[8] = 0x02;
    data.fill(0xaa, 16, 48);
    const result = benchmark('container with 3 fixed fields', 5000, () => {
        (0, index_js_1.sszStreamRootFromSlice)(containerType, data);
    });
    printResult(result);
}
// Benchmark: Container with variable field
{
    const containerType = {
        kind: index_js_1.TypeKind.Container,
        fieldTypes: [
            { kind: index_js_1.TypeKind.Basic, fixedSize: 8 },
            { kind: index_js_1.TypeKind.Basic, fixedSize: 8 },
            { kind: index_js_1.TypeKind.Basic, fixedSize: 0 }
        ]
    };
    const field1 = new Uint8Array(8);
    field1[0] = 0x01;
    const field2 = new Uint8Array(8);
    field2[0] = 0x02;
    const offset = new Uint8Array(4);
    offset[0] = 20;
    const field3 = new Uint8Array(100);
    field3.fill(0xaa);
    const data = new Uint8Array(120);
    data.set(field1, 0);
    data.set(field2, 8);
    data.set(offset, 16);
    data.set(field3, 20);
    const result = benchmark('container with variable field (100 bytes)', 2000, () => {
        (0, index_js_1.sszStreamRootFromSlice)(containerType, data);
    });
    printResult(result);
}
console.log('--- Bitlists ---\n');
// Benchmark: Small bitlist
{
    const bitlistType = { kind: index_js_1.TypeKind.Bitlist };
    const data = new Uint8Array(2);
    data[0] = 0xff;
    data[1] = 0x01;
    const result = benchmark('bitlist[8] root computation', 5000, () => {
        (0, index_js_1.sszStreamRootFromSlice)(bitlistType, data);
    });
    printResult(result);
}
// Benchmark: Large bitlist
{
    const bitlistType = { kind: index_js_1.TypeKind.Bitlist };
    const data = new Uint8Array(129); // 1024 bits + sentinel
    data.fill(0xff, 0, 128);
    data[128] = 0x01;
    const result = benchmark('bitlist[1024] root computation', 1000, () => {
        (0, index_js_1.sszStreamRootFromSlice)(bitlistType, data);
    });
    printResult(result);
}
console.log('--- Memory Efficiency ---\n');
// Test memory usage for large data
{
    console.log('  Processing 10MB of data in chunks...');
    const chunkSize = 8000; // 1000 uint64s
    const chunks = 1250; // Total 10MB
    const listType = { kind: index_js_1.TypeKind.List, elementType: uint64Type };
    const start = Date.now();
    for (let chunk = 0; chunk < chunks; chunk++) {
        const data = new Uint8Array(chunkSize);
        for (let i = 0; i < 1000; i++) {
            data[i * 8] = (chunk + i) & 0xff;
        }
        (0, index_js_1.sszStreamRootFromSlice)(listType, data);
    }
    const end = Date.now();
    console.log(`    Processed ${chunks} chunks (10MB total) in ${end - start}ms`);
    console.log(`    Throughput: ${Math.round(10000 / ((end - start) / 1000))} KB/sec\n`);
}
console.log('=== Benchmark Summary ===\n');
console.log('Implementation: Pure TypeScript with SHA-256');
console.log('Platform:', process.platform, process.arch);
console.log('Node.js:', process.version);
console.log('\nNote: For production use, consider native SHA-256 (10-100x faster)\n');
//# sourceMappingURL=benchmarks.js.map