"use strict";
/**
 * Optimized WASM merkleizer with batch processing
 * Goal: Achieve 3M+ hash operations per second in tree context
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
exports.computeRootFromChunksOptimized = computeRootFromChunksOptimized;
exports.benchmarkMerkleizationThroughput = benchmarkMerkleizationThroughput;
const sha256 = __importStar(require("@chainsafe/as-sha256"));
/**
 * Optimized merkleization using batch operations
 * Processes tree levels in batches of 4 for SIMD optimization
 */
function computeRootFromChunksOptimized(chunks) {
    if (chunks.length === 0) {
        return new Uint8Array(32);
    }
    if (chunks.length === 1) {
        return chunks[0];
    }
    let currentLevel = [...chunks];
    while (currentLevel.length > 1) {
        const nextLevel = [];
        // Process in batches of 4 pairs (8 nodes) for optimal SIMD performance
        let i = 0;
        while (i + 7 < currentLevel.length) {
            // Create batch of 4 parent nodes (each is 64 bytes)
            const batch = [];
            for (let j = 0; j < 4; j++) {
                const left = currentLevel[i + j * 2];
                const right = currentLevel[i + j * 2 + 1];
                const combined = new Uint8Array(64);
                combined.set(left, 0);
                combined.set(right, 32);
                batch.push(combined);
            }
            // Hash 4 parent nodes in parallel
            const results = sha256.batchHash4UintArray64s(batch);
            nextLevel.push(...results);
            i += 8;
        }
        // Process remaining pairs individually
        while (i + 1 < currentLevel.length) {
            const parent = sha256.digest2Bytes32(currentLevel[i], currentLevel[i + 1]);
            nextLevel.push(parent);
            i += 2;
        }
        // Handle odd number of nodes
        if (i < currentLevel.length) {
            nextLevel.push(currentLevel[i]);
        }
        currentLevel = nextLevel;
    }
    return currentLevel[0];
}
/**
 * Benchmark: Merkleization throughput (hash operations per second)
 */
function benchmarkMerkleizationThroughput() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  Merkleization Throughput - Total Hash Operations/Sec   ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    // Generate test data
    function generateChunk() {
        const chunk = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            chunk[i] = Math.floor(Math.random() * 256);
        }
        return chunk;
    }
    const testCases = [
        { size: 16, iterations: 50000 },
        { size: 64, iterations: 10000 },
        { size: 256, iterations: 2000 },
        { size: 1024, iterations: 500 },
        { size: 4096, iterations: 100 },
    ];
    for (const { size, iterations } of testCases) {
        const chunks = Array.from({ length: size }, () => generateChunk());
        // Calculate total hash operations needed for complete merkleization
        // For a tree with N leaves, we need N-1 parent hashes to reach the root
        const hashOpsPerMerkleization = size - 1;
        // Benchmark
        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
            computeRootFromChunksOptimized(chunks);
        }
        const elapsed = (performance.now() - start) / 1000;
        const merkleizationsPerSec = iterations / elapsed;
        const totalHashOpsPerSec = merkleizationsPerSec * hashOpsPerMerkleization;
        console.log(`Tree size: ${size} leaves`);
        console.log(`  Merkleizations/sec: ${merkleizationsPerSec.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
        console.log(`  Hash ops/merkleization: ${hashOpsPerMerkleization}`);
        console.log(`  Total hash ops/sec: ${(totalHashOpsPerSec / 1000000).toFixed(2)}M`);
        console.log(`  ${totalHashOpsPerSec >= 3000000 ? '✅ TARGET MET (3M+)' : '⚠️  Below 3M target'}\n`);
    }
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Note: "Hash operations per second" = merkleizations/sec × (N-1)');
    console.log('This is the industry-standard metric for merkleization throughput.');
    console.log('═══════════════════════════════════════════════════════════');
}
// Run benchmark if executed directly
if (require.main === module) {
    benchmarkMerkleizationThroughput();
}
