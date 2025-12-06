"use strict";
/**
 * Direct performance test: Compare our wrappers vs direct @chainsafe/as-sha256 calls
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const sha256 = __importStar(require("@chainsafe/as-sha256"));
const hash_wasm_1 = require("../src/hash-wasm");
const ITERATIONS = 1000000;
function generateRandomChunk() {
    const chunk = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
        chunk[i] = Math.floor(Math.random() * 256);
    }
    return chunk;
}
console.log('=== Direct Performance Comparison ===\n');
console.log(`SIMD enabled: ${sha256.simdEnabled ? 'YES ✅' : 'NO ❌'}`);
console.log(`Iterations: ${ITERATIONS.toLocaleString()}\n`);
const chunk1 = generateRandomChunk();
const chunk2 = generateRandomChunk();
// Test 1: Direct @chainsafe/as-sha256 digest
console.log('Test 1: Direct sha256.digest()');
let start = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    sha256.digest(chunk1);
}
let elapsed = (Date.now() - start) / 1000;
let ops = ITERATIONS / elapsed;
console.log(`  ${(ops / 1000000).toFixed(2)}M ops/sec\n`);
// Test 2: Our hashLeafWasm wrapper
console.log('Test 2: Our hashLeafWasm() wrapper');
start = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    (0, hash_wasm_1.hashLeafWasm)(chunk1);
}
elapsed = (Date.now() - start) / 1000;
ops = ITERATIONS / elapsed;
console.log(`  ${(ops / 1000000).toFixed(2)}M ops/sec\n`);
// Test 3: Direct sha256.digest2Bytes32
console.log('Test 3: Direct sha256.digest2Bytes32()');
start = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    sha256.digest2Bytes32(chunk1, chunk2);
}
elapsed = (Date.now() - start) / 1000;
ops = ITERATIONS / elapsed;
console.log(`  ${(ops / 1000000).toFixed(2)}M ops/sec\n`);
// Test 4: Our hashParentWasm wrapper
console.log('Test 4: Our hashParentWasm() wrapper');
start = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    (0, hash_wasm_1.hashParentWasm)(chunk1, chunk2);
}
elapsed = (Date.now() - start) / 1000;
ops = ITERATIONS / elapsed;
console.log(`  ${(ops / 1000000).toFixed(2)}M ops/sec\n`);
// Test 5: Batch processing
console.log('Test 5: Batch processing (4 pairs at once)');
// Each element in batch should be 64 bytes (parent node)
const combined1 = new Uint8Array(64);
combined1.set(chunk1, 0);
combined1.set(chunk2, 32);
const combined2 = new Uint8Array(64);
combined2.set(chunk1, 0);
combined2.set(chunk2, 32);
const combined3 = new Uint8Array(64);
combined3.set(chunk1, 0);
combined3.set(chunk2, 32);
const combined4 = new Uint8Array(64);
combined4.set(chunk1, 0);
combined4.set(chunk2, 32);
const batch = [combined1, combined2, combined3, combined4];
start = Date.now();
for (let i = 0; i < ITERATIONS / 4; i++) {
    sha256.batchHash4UintArray64s(batch);
}
elapsed = (Date.now() - start) / 1000;
ops = (ITERATIONS / 4 * 4) / elapsed; // 4 hashes per call
console.log(`  ${(ops / 1000000).toFixed(2)}M ops/sec\n`);
console.log('=== Conclusion ===');
console.log('If wrappers are slower, we should use sha256 functions directly.');
console.log('If we\'re still under 3M ops/sec, the issue is algorithmic, not wrapper overhead.');
//# sourceMappingURL=direct-benchmark.js.map