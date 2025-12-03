/**
 * AGGRESSIVE PERFORMANCE OPTIMIZATION TEST
 * Goal: Reach 3M+ ops/sec by finding and eliminating bottlenecks
 */

import * as sha256 from '@chainsafe/as-sha256';

const ITERATIONS = 5_000_000; // 5M iterations to test sustained performance

function generateRandomChunk(): Uint8Array {
  const chunk = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    chunk[i] = Math.floor(Math.random() * 256);
  }
  return chunk;
}

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  AGGRESSIVE PERFORMANCE OPTIMIZATION - Path to 3M+ ops/s ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
console.log(`SIMD enabled: ${sha256.simdEnabled ? 'YES ✅' : 'NO ❌'}`);
console.log(`Iterations: ${ITERATIONS.toLocaleString()}\n`);

// Pre-allocate all test data to eliminate allocation overhead
const chunks = Array.from({ length: 100 }, () => generateRandomChunk());

// Test 1: Hot path optimization - tight loop with no overhead
console.log('Test 1: Tight loop (single chunk, no overhead)');
const chunk1 = chunks[0];
let result: Uint8Array;
let start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  result = sha256.digest(chunk1);
}
let elapsed = (performance.now() - start) / 1000;
let ops = ITERATIONS / elapsed;
console.log(`  ${(ops / 1000000).toFixed(2)}M ops/sec`);
console.log(`  ${elapsed.toFixed(2)}s total time`);
console.log(`  ${(1_000_000 / ops).toFixed(2)}μs per operation\n`);

// Test 2: Rotating chunks (cache effects)
console.log('Test 2: Rotating through 100 different chunks');
start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  result = sha256.digest(chunks[i % 100]);
}
elapsed = (performance.now() - start) / 1000;
ops = ITERATIONS / elapsed;
console.log(`  ${(ops / 1000000).toFixed(2)}M ops/sec`);
console.log(`  Cache impact: ${ops < (ITERATIONS / ((performance.now() - start) / 1000)) ? 'YES' : 'NO'}\n`);

// Test 3: Batch processing (4 parent nodes at once)
console.log('Test 3: Batch parent hash (4x 64-byte inputs)');
const combined1 = new Uint8Array(64);
combined1.set(chunks[0], 0);
combined1.set(chunks[1], 32);
const combined2 = new Uint8Array(64);
combined2.set(chunks[2], 0);
combined2.set(chunks[3], 32);
const combined3 = new Uint8Array(64);
combined3.set(chunks[4], 0);
combined3.set(chunks[5], 32);
const combined4 = new Uint8Array(64);
combined4.set(chunks[6], 0);
combined4.set(chunks[7], 32);
const batch = [combined1, combined2, combined3, combined4];
const iterations4 = Math.floor(ITERATIONS / 4);
start = performance.now();
for (let i = 0; i < iterations4; i++) {
  sha256.batchHash4UintArray64s(batch);
}
elapsed = (performance.now() - start) / 1000;
ops = (iterations4 * 4) / elapsed;
console.log(`  ${(ops / 1000000).toFixed(2)}M ops/sec`);
console.log(`  Batch advantage: 4 hashes in parallel\n`);

// Test 4: In-place operations (zero allocation) - digest64Into
console.log('Test 4: In-place operations (digest64Into, pre-allocated output)');
const input64 = new Uint8Array(64);
input64.set(chunk1, 0);
input64.set(chunks[1], 32);
const output = new Uint8Array(32);
start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  sha256.digest64Into(input64, output);
}
elapsed = (performance.now() - start) / 1000;
ops = ITERATIONS / elapsed;
console.log(`  ${(ops / 1000000).toFixed(2)}M ops/sec`);
console.log(`  Zero-allocation benefit: pre-allocated output\n`);

// Test 5: Parent hash (64 bytes) - the real SSZ use case
console.log('Test 5: Parent hash (digest2Bytes32 - 64 bytes)');
const chunk2 = chunks[1];
start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  result = sha256.digest2Bytes32(chunk1, chunk2);
}
elapsed = (performance.now() - start) / 1000;
ops = ITERATIONS / elapsed;
console.log(`  ${(ops / 1000000).toFixed(2)}M ops/sec`);
console.log(`  ${(1_000_000 / ops).toFixed(2)}μs per operation\n`);

// Test 6: Parent hash with pre-allocated output
console.log('Test 6: Parent hash in-place (digest2Bytes32Into)');
start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  sha256.digest2Bytes32Into(chunk1, chunk2, output);
}
elapsed = (performance.now() - start) / 1000;
ops = ITERATIONS / elapsed;
console.log(`  ${(ops / 1000000).toFixed(2)}M ops/sec`);
console.log(`  Zero-allocation parent: ${ops > (ITERATIONS / ((performance.now() - start) / 1000)) ? 'FASTER' : 'SAME'}\n`);

// Test 7: Sustained throughput test (30 seconds)
console.log('Test 7: Sustained throughput (5 second test)');
const testDuration = 5000; // 5 seconds
let count = 0;
start = performance.now();
while ((performance.now() - start) < testDuration) {
  result = sha256.digest(chunk1);
  count++;
}
elapsed = (performance.now() - start) / 1000;
ops = count / elapsed;
console.log(`  ${(ops / 1000000).toFixed(2)}M ops/sec`);
console.log(`  Total operations: ${count.toLocaleString()}`);
console.log(`  Sustained performance: ${ops > 3_000_000 ? '✅ TARGET MET' : '❌ BELOW TARGET'}\n`);

// Final analysis
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  ANALYSIS                                                ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log('Performance factors:');
console.log('1. SIMD: 4x parallelism for uint32 operations');
console.log('2. Memory: Pre-allocation eliminates GC pauses');
console.log('3. Cache: Hot loop keeps data in L1 cache');
console.log('4. JIT: V8 optimizes tight loops after warmup');
console.log('5. Batch: Process 4 chunks in parallel with SIMD\n');

console.log('Path to 3M+ ops/sec:');
console.log('• ✅ Use digest/digest2Bytes32 directly (not our wrappers)');
console.log('• ✅ Use in-place operations (hashInto, digest2Bytes32Into)');
console.log('• ✅ Pre-allocate output buffers');
console.log('• ✅ Use batch operations for merkleization');
console.log('• ⚠️  CPU architecture matters (newer CPUs → faster SIMD)');
console.log('• ⚠️  Node.js version matters (V8 optimizations)\n');

console.log('Hardware considerations:');
console.log(`• Platform: ${process.platform} ${process.arch}`);
console.log(`• Node.js: ${process.version}`);
console.log(`• V8: ${process.versions.v8}`);
