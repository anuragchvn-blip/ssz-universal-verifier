/**
 * Multi-threaded merkleizer using Worker Threads
 * Path to 3M+ ops/sec on older hardware
 */

import { Worker } from 'worker_threads';
import * as path from 'path';
import { hashParent } from './hash.js';

interface WorkerTask {
  chunks: Uint8Array[];
  taskId: number;
}

interface WorkerResult {
  root: Uint8Array;
  taskId: number;
}

/**
 * Parallel merkleization using worker threads
 * Splits tree into subtrees, processes in parallel, combines results
 */
export async function computeRootFromChunksParallel(
  chunks: Uint8Array[],
  numThreads: number = 4
): Promise<Uint8Array> {
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
  const subtrees: Uint8Array[][] = [];

  for (let i = 0; i < chunks.length; i += chunkSize) {
    subtrees.push(chunks.slice(i, Math.min(i + chunkSize, chunks.length)));
  }

  // Process subtrees in parallel
  const workers: Worker[] = [];
  const results: Promise<Uint8Array>[] = [];

  try {
    for (let i = 0; i < subtrees.length; i++) {
      const promise = new Promise<Uint8Array>((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, 'merkle-worker.js'), {
          workerData: { chunks: subtrees[i], taskId: i },
        });

        workers.push(worker);

        worker.on('message', (result: WorkerResult) => {
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
  } finally {
    // Clean up workers
    workers.forEach((w) => w.terminate());
  }
}

/**
 * Single-threaded fallback (same as optimized merkleizer)
 */
function computeRootSingleThreaded(chunks: Uint8Array[]): Uint8Array {
  if (chunks.length === 0) return new Uint8Array(32);
  if (chunks.length === 1) return chunks[0];

  let currentLevel = [...chunks];

  while (currentLevel.length > 1) {
    const nextLevel: Uint8Array[] = [];

    // Process in batches of 4 for SIMD
    let i = 0;
    while (i + 7 < currentLevel.length) {
      const batch: Uint8Array[] = [];
      for (let j = 0; j < 4; j++) {
        const combined = new Uint8Array(64);
        combined.set(currentLevel[i + j * 2], 0);
        combined.set(currentLevel[i + j * 2 + 1], 32);
        batch.push(combined);
      }

      for (const combined of batch) {
        const left = combined.subarray(0, 32);
        const right = combined.subarray(32, 64);
        nextLevel.push(hashParent(left, right));
      }
      i += 8;
    }

    while (i + 1 < currentLevel.length) {
      const parent = hashParent(currentLevel[i], currentLevel[i + 1]);
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
export async function benchmarkParallelMerkleization() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Multi-threaded Merkleization Benchmark                 ║');
  console.log('║  Intel i7-2600 (2011) - 4 cores, 8 threads              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  function generateChunk(): Uint8Array {
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
        } else {
          await computeRootFromChunksParallel(chunks, numThreads);
        }
      }

      const elapsed = (performance.now() - start) / 1000;
      const merkleizationsPerSec = iterations / elapsed;
      const totalHashOpsPerSec = merkleizationsPerSec * hashOpsPerMerkleization;

      console.log(
        `  ${numThreads} thread${numThreads > 1 ? 's' : ' '}: ${(totalHashOpsPerSec / 1000000).toFixed(2)}M hash ops/sec`
      );

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
