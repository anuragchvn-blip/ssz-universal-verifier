/**
 * Native SHA-256 Benchmark
 * Compare: Native addon vs @chainsafe/as-sha256 vs Our WASM vs Pure TS
 */

const path = require('path');
const nativeSHA = require(path.join(process.cwd(), 'native/build/Release/ssz_native.node'));
import * as chainsafe from '@chainsafe/as-sha256';
import { hashLeaf as pureTS } from '../src/hash';

const ITERATIONS = 5_000_000;

function generateChunk(): Buffer {
  const chunk = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    chunk[i] = Math.floor(Math.random() * 256);
  }
  return chunk;
}

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  Native SHA-256 Addon Performance Benchmark           ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log(`Platform: ${process.platform} ${process.arch}`);
console.log(`Node.js: ${process.version}`);
console.log(`Native support: ${nativeSHA.hasNativeSupport() ? '✅' : '❌'}`);
console.log(`Implementation: ${nativeSHA.getImplementation()}\n`);

const chunk1 = generateChunk();
const chunk2 = generateChunk();

// Variables for tracking results
let start: number;
let elapsed: number;
let opsNative: number = 0;
let opsChainsafe: number = 0;
let opsPureTS: number = 0;

// Test 1: Our Native Addon
console.log('Test 1: Our Native Addon (Intel SHA-NI)');
start = performance.now();
try {
  for (let i = 0; i < ITERATIONS; i++) {
    nativeSHA.hashLeaf(chunk1);
  }
  elapsed = (performance.now() - start) / 1000;
  opsNative = ITERATIONS / elapsed;
  console.log(`  ${(opsNative / 1000000).toFixed(2)}M ops/sec\n`);
} catch (err: any) {
  console.error(`  ERROR: ${err.message}\n`);
  process.exit(1);
}

// Test 2: @chainsafe/as-sha256 (WASM)
console.log('Test 2: @chainsafe/as-sha256 (WASM + SIMD)');
start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  chainsafe.digest(Uint8Array.from(chunk1));
}
elapsed = (performance.now() - start) / 1000;
opsChainsafe = ITERATIONS / elapsed;
console.log(`  ${(opsChainsafe / 1000000).toFixed(2)}M ops/sec\n`);

// Test 3: Pure TypeScript
console.log('Test 3: Pure TypeScript');
start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  pureTS(Uint8Array.from(chunk1));
}
elapsed = (performance.now() - start) / 1000;
opsPureTS = ITERATIONS / elapsed;
console.log(`  ${(opsPureTS / 1000000).toFixed(2)}M ops/sec\n`);

// Parent hash comparison
console.log('═══════════════════════════════════════════════════════');
console.log('Parent Hash (64 bytes) Comparison\n');

console.log('Our Native:');
start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  nativeSHA.hashParent(chunk1, chunk2);
}
elapsed = (performance.now() - start) / 1000;
let opsNativeParent = ITERATIONS / elapsed;
console.log(`  ${(opsNativeParent / 1000000).toFixed(2)}M ops/sec\n`);

console.log('@chainsafe WASM:');
start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  chainsafe.digest2Bytes32(Uint8Array.from(chunk1), Uint8Array.from(chunk2));
}
elapsed = (performance.now() - start) / 1000;
let opsChainsafeParent = ITERATIONS / elapsed;
console.log(`  ${(opsChainsafeParent / 1000000).toFixed(2)}M ops/sec\n`);

// Final comparison
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  PERFORMANCE COMPARISON                                ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const speedupVsChainsafe = opsNative / opsChainsafe;
const speedupVsPureTS = opsNative / opsPureTS;

console.log(`Our Native vs @chainsafe/ssz: ${speedupVsChainsafe.toFixed(2)}x faster`);
console.log(`Our Native vs Pure TypeScript: ${speedupVsPureTS.toFixed(2)}x faster\n`);

if (opsNative >= 3_000_000) {
  console.log('✅ TARGET ACHIEVED: 3M+ ops/sec!');
} else {
  console.log(`⚠️  Current: ${(opsNative / 1000000).toFixed(2)}M ops/sec`);
  console.log(`   Target: 3M+ ops/sec`);
  console.log(`   Note: Requires modern CPU (2020+) with SHA extensions`);
}
