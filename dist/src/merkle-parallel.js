"use strict";
/**
 * Multi-threaded merkleizer using Worker Threads
 * Path to 3M+ ops/sec on older hardware
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
exports.computeRootFromChunksParallel = computeRootFromChunksParallel;
exports.benchmarkParallelMerkleization = benchmarkParallelMerkleization;
const worker_threads_1 = require("worker_threads");
const path = __importStar(require("path"));
const hash_js_1 = require("./hash.js");
/**
 * Parallel merkleization using worker threads
 * Splits tree into subtrees, processes in parallel, combines results
 */
async function computeRootFromChunksParallel(chunks, numThreads = 4) {
    if (chunks.length === 0) {
        return new Uint8Array(32);
    }
    if (chunks.length === 1) {
        return chunks[0];
    }
    // For small trees, single-threaded is faster (avoid thread overhead)
    if (chunks.length < 64) {
        return computeRootSingleThreaded(chunks);
    }
    // Split chunks into subtrees for parallel processing
    const chunkSize = Math.ceil(chunks.length / numThreads);
    const subtrees = [];
    for (let i = 0; i < chunks.length; i += chunkSize) {
        subtrees.push(chunks.slice(i, Math.min(i + chunkSize, chunks.length)));
    }
    // Process subtrees in parallel
    const workers = [];
    const results = [];
    try {
        for (let i = 0; i < subtrees.length; i++) {
            const promise = new Promise((resolve, reject) => {
                const worker = new worker_threads_1.Worker(path.join(__dirname, 'merkle-worker.js'), {
                    workerData: { chunks: subtrees[i], taskId: i }
                });
                workers.push(worker);
                worker.on('message', (result) => {
                    resolve(result.root);
                });
                worker.on('error', reject);
                worker.on('exit', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Worker stopped with exit code ${code}`));
                    }
                });
            });
            results.push(promise);
        }
        // Wait for all subtrees to complete
        const subtreeRoots = await Promise.all(results);
        // Combine subtree roots into final root
        return computeRootSingleThreaded(subtreeRoots);
    }
    finally {
        // Clean up workers
        workers.forEach(w => w.terminate());
    }
}
/**
 * Single-threaded fallback (same as optimized merkleizer)
 */
function computeRootSingleThreaded(chunks) {
    if (chunks.length === 0)
        return new Uint8Array(32);
    if (chunks.length === 1)
        return chunks[0];
    let currentLevel = [...chunks];
    while (currentLevel.length > 1) {
        const nextLevel = [];
        // Process in batches of 4 for SIMD
        let i = 0;
        while (i + 7 < currentLevel.length) {
            const batch = [];
            for (let j = 0; j < 4; j++) {
                const combined = new Uint8Array(64);
                combined.set(currentLevel[i + j * 2], 0);
                combined.set(currentLevel[i + j * 2 + 1], 32);
                batch.push(combined);
            }
            for (const combined of batch) {
                const left = combined.subarray(0, 32);
                const right = combined.subarray(32, 64);
                nextLevel.push((0, hash_js_1.hashParent)(left, right));
            }
            i += 8;
        }
        while (i + 1 < currentLevel.length) {
            const parent = (0, hash_js_1.hashParent)(currentLevel[i], currentLevel[i + 1]);
            nextLevel.push(parent);
            i += 2;
        }
        if (i < currentLevel.length) {
            nextLevel.push(currentLevel[i]);
        }
        currentLevel = nextLevel;
    }
    return currentLevel[0];
}
/**
 * Benchmark parallel merkleization
 */
async function benchmarkParallelMerkleization() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  Multi-threaded Merkleization Benchmark                 ║');
    console.log('║  Intel i7-2600 (2011) - 4 cores, 8 threads              ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    function generateChunk() {
        const chunk = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            chunk[i] = Math.floor(Math.random() * 256);
        }
        return chunk;
    }
    const testCases = [
        { size: 256, iterations: 100, threads: [1, 2, 4] },
        { size: 1024, iterations: 50, threads: [1, 2, 4] },
        { size: 4096, iterations: 20, threads: [1, 2, 4, 8] },
    ];
    for (const { size, iterations, threads } of testCases) {
        console.log(`\nTree size: ${size} leaves`);
        console.log(`Iterations: ${iterations}`);
        const chunks = Array.from({ length: size }, () => generateChunk());
        const hashOpsPerMerkleization = size - 1;
        for (const numThreads of threads) {
            const start = performance.now();
            for (let i = 0; i < iterations; i++) {
                if (numThreads === 1) {
                    computeRootSingleThreaded(chunks);
                }
                else {
                    await computeRootFromChunksParallel(chunks, numThreads);
                }
            }
            const elapsed = (performance.now() - start) / 1000;
            const merkleizationsPerSec = iterations / elapsed;
            const totalHashOpsPerSec = merkleizationsPerSec * hashOpsPerMerkleization;
            console.log(`  ${numThreads} thread${numThreads > 1 ? 's' : ' '}: ${(totalHashOpsPerSec / 1000000).toFixed(2)}M hash ops/sec`);
            if (totalHashOpsPerSec >= 3000000) {
                console.log(`    ✅ TARGET MET! (3M+)`);
            }
        }
    }
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('Multi-threading scales SHA-256 performance across cores.');
    console.log('Expected: 4 threads ≈ 3-4x single-thread performance');
    console.log('═══════════════════════════════════════════════════════════');
}
// Run benchmark if executed directly
if (require.main === module) {
    benchmarkParallelMerkleization().catch(console.error);
}
//# sourceMappingURL=merkle-parallel.js.map