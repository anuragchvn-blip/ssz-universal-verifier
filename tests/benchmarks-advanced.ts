/**
 * Advanced benchmarks: WebCrypto vs Pure TypeScript vs @chainsafe/ssz
 * Target: 3M+ ops/sec minimum
 */

import { hashLeaf, hashParent } from '../src/hash';
import {
  hashLeafAsync,
  hashParentAsync,
  computeRootFromChunksAsync,
  isWebCryptoAvailable,
  getWebCryptoInfo
} from '../src/hash-webcrypto';
import {
  hashLeafWasm,
  hashParentWasm,
  computeRootFromChunksWasm,
  isWasmAvailable
} from '../src/hash-wasm';
import { computeRootFromChunks } from '../src/merkle';

// Benchmark configuration
const WARMUP_ITERATIONS = 1000;
const BENCH_ITERATIONS = 100000;
const BATCH_SIZES = [1, 10, 100, 1000, 10000];

function generateRandomChunk(): Uint8Array {
  const chunk = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    chunk[i] = Math.floor(Math.random() * 256);
  }
  return chunk;
}

function formatOpsPerSec(ops: number): string {
  if (ops >= 1000000) {
    return `${(ops / 1000000).toFixed(2)}M ops/sec`;
  } else if (ops >= 1000) {
    return `${(ops / 1000).toFixed(2)}K ops/sec`;
  }
  return `${ops.toFixed(0)} ops/sec`;
}

function formatThroughput(bytesPerSec: number): string {
  if (bytesPerSec >= 1000000) {
    return `${(bytesPerSec / 1000000).toFixed(2)} MB/sec`;
  } else if (bytesPerSec >= 1000) {
    return `${(bytesPerSec / 1000).toFixed(2)} KB/sec`;
  }
  return `${bytesPerSec.toFixed(0)} B/sec`;
}

// Benchmark: Pure TypeScript SHA-256
function benchmarkPureTypeScript(): void {
  console.log('\n=== Pure TypeScript SHA-256 ===');
  
  const chunk1 = generateRandomChunk();
  const chunk2 = generateRandomChunk();

  // Warmup
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    hashLeaf(chunk1);
  }

  // Single hash benchmark
  const startSingle = Date.now();
  for (let i = 0; i < BENCH_ITERATIONS; i++) {
    hashLeaf(chunk1);
  }
  const elapsedSingle = (Date.now() - startSingle) / 1000;
  const opsSingle = BENCH_ITERATIONS / elapsedSingle;
  const throughputSingle = opsSingle * 32;

  console.log(`hashLeaf (32 bytes):   ${formatOpsPerSec(opsSingle)} | ${formatThroughput(throughputSingle)}`);

  // Parent hash benchmark
  const startParent = Date.now();
  for (let i = 0; i < BENCH_ITERATIONS; i++) {
    hashParent(chunk1, chunk2);
  }
  const elapsedParent = (Date.now() - startParent) / 1000;
  const opsParent = BENCH_ITERATIONS / elapsedParent;
  const throughputParent = opsParent * 64;

  console.log(`hashParent (64 bytes): ${formatOpsPerSec(opsParent)} | ${formatThroughput(throughputParent)}`);
}

// Benchmark: WASM SHA-256 (@chainsafe/as-sha256)
function benchmarkWasm(): number {
  console.log('\n=== WASM SHA-256 (@chainsafe/as-sha256 - Synchronous) ===');

  if (!isWasmAvailable()) {
    console.log('⚠️  WASM not available, skipping benchmark');
    return 0;
  }

  const chunk1 = generateRandomChunk();
  const chunk2 = generateRandomChunk();

  // Warmup
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    hashLeafWasm(chunk1);
  }

  // Single hash benchmark
  const startSingle = Date.now();
  for (let i = 0; i < BENCH_ITERATIONS; i++) {
    hashLeafWasm(chunk1);
  }
  const elapsedSingle = (Date.now() - startSingle) / 1000;
  const opsSingle = BENCH_ITERATIONS / elapsedSingle;
  const throughputSingle = opsSingle * 32;

  console.log(`hashLeafWasm (32 bytes):   ${formatOpsPerSec(opsSingle)} | ${formatThroughput(throughputSingle)}`);

  // Parent hash benchmark
  const startParent = Date.now();
  for (let i = 0; i < BENCH_ITERATIONS; i++) {
    hashParentWasm(chunk1, chunk2);
  }
  const elapsedParent = (Date.now() - startParent) / 1000;
  const opsParent = BENCH_ITERATIONS / elapsedParent;
  const throughputParent = opsParent * 64;

  console.log(`hashParentWasm (64 bytes): ${formatOpsPerSec(opsParent)} | ${formatThroughput(throughputParent)}`);

  return opsSingle;
}

// Benchmark: WebCrypto SHA-256
async function benchmarkWebCrypto(): Promise<void> {
  console.log('\n=== WebCrypto SHA-256 (Async - NOT RECOMMENDED) ===');
  console.log(getWebCryptoInfo());

  if (!isWebCryptoAvailable()) {
    console.log('⚠️  WebCrypto not available, skipping benchmark');
    return;
  }

  const chunk1 = generateRandomChunk();
  const chunk2 = generateRandomChunk();

  // Warmup
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    await hashLeafAsync(chunk1);
  }

  // Single hash benchmark
  const startSingle = Date.now();
  for (let i = 0; i < BENCH_ITERATIONS; i++) {
    await hashLeafAsync(chunk1);
  }
  const elapsedSingle = (Date.now() - startSingle) / 1000;
  const opsSingle = BENCH_ITERATIONS / elapsedSingle;
  const throughputSingle = opsSingle * 32;

  console.log(`hashLeafAsync (32 bytes):   ${formatOpsPerSec(opsSingle)} | ${formatThroughput(throughputSingle)}`);

  // Parent hash benchmark
  const startParent = Date.now();
  for (let i = 0; i < BENCH_ITERATIONS; i++) {
    await hashParentAsync(chunk1, chunk2);
  }
  const elapsedParent = (Date.now() - startParent) / 1000;
  const opsParent = BENCH_ITERATIONS / elapsedParent;
  const throughputParent = opsParent * 64;

  console.log(`hashParentAsync (64 bytes): ${formatOpsPerSec(opsParent)} | ${formatThroughput(throughputParent)}`);
  console.log('⚠️  Note: WebCrypto is async and has overhead - use WASM instead for production');
}

// Benchmark: Merkleization at different batch sizes
async function benchmarkMerkleization(): Promise<void> {
  console.log('\n=== Merkleization Benchmarks ===');

  for (const batchSize of BATCH_SIZES) {
    const chunks = Array.from({ length: batchSize }, () => generateRandomChunk());

    // Pure TypeScript - using generator
    const startSync = Date.now();
    for (let i = 0; i < 1000; i++) {
      function* chunkGen() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }
      computeRootFromChunks(chunkGen());
    }
    const elapsedSync = (Date.now() - startSync) / 1000;
    const opsSync = 1000 / elapsedSync;

    // WASM (if available)
    let opsWasm = 0;
    if (isWasmAvailable()) {
      const startWasm = Date.now();
      for (let i = 0; i < 1000; i++) {
        computeRootFromChunksWasm(chunks);
      }
      const elapsedWasm = (Date.now() - startWasm) / 1000;
      opsWasm = 1000 / elapsedWasm;
    }

    console.log(`\nBatch size: ${batchSize} chunks (${batchSize * 32} bytes)`);
    console.log(`  Pure TypeScript: ${formatOpsPerSec(opsSync)}`);
    if (opsWasm > 0) {
      console.log(`  WASM:            ${formatOpsPerSec(opsWasm)} (${(opsWasm / opsSync).toFixed(2)}x)`);
    }
  }
}

// Benchmark: @chainsafe/ssz comparison
async function benchmarkChainsafe(): Promise<void> {
  console.log('\n=== @chainsafe/ssz Comparison ===');
  
  try {
    // Import @chainsafe/ssz types and merkleization functions
    const ssz = await import('@chainsafe/ssz');
    const sha256 = await import('@chainsafe/as-sha256');
    
    console.log('✓ @chainsafe/ssz found');
    console.log(`SIMD enabled: ${sha256.simdEnabled ? 'YES ✅' : 'NO ❌'}`);
    
    // Test their hash performance directly
    const chunk1 = generateRandomChunk();
    const chunk2 = generateRandomChunk();
    
    // Warmup
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
      sha256.digest(chunk1);
    }
    
    // Benchmark their digest function
    const start = Date.now();
    for (let i = 0; i < BENCH_ITERATIONS; i++) {
      sha256.digest(chunk1);
    }
    const elapsed = (Date.now() - start) / 1000;
    const ops = BENCH_ITERATIONS / elapsed;
    const throughput = ops * 32;
    
    console.log(`@chainsafe/as-sha256 digest: ${formatOpsPerSec(ops)} | ${formatThroughput(throughput)}`);
    
    // Benchmark their digest2Bytes32 function
    const start2 = Date.now();
    for (let i = 0; i < BENCH_ITERATIONS; i++) {
      sha256.digest2Bytes32(chunk1, chunk2);
    }
    const elapsed2 = (Date.now() - start2) / 1000;
    const ops2 = BENCH_ITERATIONS / elapsed2;
    const throughput2 = ops2 * 64;
    
    console.log(`@chainsafe/as-sha256 digest2: ${formatOpsPerSec(ops2)} | ${formatThroughput(throughput2)}`);
    
    // Try to enable SIMD if not already enabled
    if (!sha256.simdEnabled) {
      console.log('\n🔧 Attempting to enable SIMD...');
      try {
        sha256.reinitializeInstance(true);
        console.log(`SIMD enabled: ${sha256.simdEnabled ? 'YES ✅' : 'NO ❌ (not supported on this platform)'}`);
        
        if (sha256.simdEnabled) {
          // Re-benchmark with SIMD
          const startSIMD = Date.now();
          for (let i = 0; i < BENCH_ITERATIONS; i++) {
            sha256.digest(chunk1);
          }
          const elapsedSIMD = (Date.now() - startSIMD) / 1000;
          const opsSIMD = BENCH_ITERATIONS / elapsedSIMD;
          
          console.log(`With SIMD: ${formatOpsPerSec(opsSIMD)} (${(opsSIMD / ops).toFixed(2)}x improvement)`);
        }
      } catch (err) {
        console.log(`❌ Failed to enable SIMD: ${err}`);
      }
    }
    
  } catch (error) {
    console.log('⚠️  @chainsafe/ssz not installed');
    console.log('   Install with: npm install @chainsafe/ssz');
    console.log('   Then run benchmarks again for comparison');
  }
}

// Performance target validation
function validatePerformanceTargets(webCryptoOps: number): void {
  console.log('\n=== Performance Target Validation ===');
  
  const TARGET_OPS = 3000000; // 3M ops/sec minimum
  const STRETCH_TARGET = 5000000; // 5M ops/sec stretch goal (match @chainsafe/ssz)
  
  console.log(`Current:        ${formatOpsPerSec(webCryptoOps)}`);
  console.log(`Minimum Target: ${formatOpsPerSec(TARGET_OPS)}`);
  console.log(`Stretch Goal:   ${formatOpsPerSec(STRETCH_TARGET)}`);
  
  if (webCryptoOps >= STRETCH_TARGET) {
    console.log('✅ STRETCH GOAL ACHIEVED! Performance matches @chainsafe/ssz');
  } else if (webCryptoOps >= TARGET_OPS) {
    console.log('✅ MINIMUM TARGET ACHIEVED! Performance acceptable for production');
  } else {
    const gap = TARGET_OPS - webCryptoOps;
    const gapPercent = ((TARGET_OPS / webCryptoOps - 1) * 100).toFixed(1);
    console.log(`❌ TARGET NOT MET: Need ${formatOpsPerSec(gap)} more (${gapPercent}% improvement needed)`);
  }
}

// Main benchmark runner
async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  SSZ Universal Verifier - Advanced Performance Benchmarks  ║');
  console.log('║  Target: 3M+ ops/sec | Stretch Goal: 5M+ ops/sec          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log(`\nBenchmark configuration:`);
  console.log(`  Warmup iterations:    ${WARMUP_ITERATIONS.toLocaleString()}`);
  console.log(`  Benchmark iterations: ${BENCH_ITERATIONS.toLocaleString()}`);
  console.log(`  Node.js version:      ${process.version}`);
  console.log(`  Platform:             ${process.platform} ${process.arch}`);

  // Run benchmarks
  benchmarkPureTypeScript();
  const wasmOps = benchmarkWasm();
  await benchmarkWebCrypto();
  await benchmarkMerkleization();
  await benchmarkChainsafe();
  
  // Validate performance targets
  if (wasmOps > 0) {
    validatePerformanceTargets(wasmOps);
  }

  // Final summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Benchmark Complete                                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\nNext steps:');
  console.log('1. Install @chainsafe/ssz: npm install @chainsafe/ssz');
  console.log('2. Implement WASM SIMD optimizations');
  console.log('3. Profile and optimize hot paths');
  console.log('4. Run fuzzing and validation tests');
}

// Run benchmarks
main().catch(console.error);
