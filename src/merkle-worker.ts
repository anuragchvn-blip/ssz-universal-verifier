/**
 * Worker thread for parallel merkleization
 * Processes a subtree and returns the root
 */

const { parentPort, workerData } = require('worker_threads');
import { hashParent } from './hash.js';

interface WorkerData {
  chunks: Uint8Array[];
  taskId: number;
}

function computeRoot(chunks: Uint8Array[]): Uint8Array {
  if (chunks.length === 0) return new Uint8Array(32);
  if (chunks.length === 1) return chunks[0];

  let currentLevel = [...chunks];

  while (currentLevel.length > 1) {
    const nextLevel: Uint8Array[] = [];

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

// Process the subtree
const { chunks, taskId } = workerData as WorkerData;
const root = computeRoot(chunks);

// Send result back to main thread
parentPort?.postMessage({ root, taskId });
