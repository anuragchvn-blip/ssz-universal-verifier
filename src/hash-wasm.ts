/**
 * WASM-accelerated SHA-256 using @chainsafe/as-sha256
 * Synchronous, ~10-20x faster than pure TypeScript
 */

import { digest, digest2Bytes32, batchHash4UintArray64s } from '@chainsafe/as-sha256';

/**
 * Hash a single 32-byte chunk using WASM
 * ~10-20x faster than pure TypeScript
 */
export function hashLeafWasm(chunk32: Uint8Array): Uint8Array {
  return digest(chunk32);
}

/**
 * Hash parent node (64 bytes) using WASM
 * ~10-20x faster than pure TypeScript
 * Uses optimized digest2Bytes32 for two 32-byte inputs
 */
export function hashParentWasm(left32: Uint8Array, right32: Uint8Array): Uint8Array {
  return digest2Bytes32(left32, right32);
}

/**
 * Batch hash multiple parent nodes using optimized WASM
 * Uses batchHash4UintArray64s for maximum performance (hashes 4 pairs in parallel)
 */
export function hashParentBatchWasm(
  pairs: Array<{ left: Uint8Array; right: Uint8Array }>
): Uint8Array[] {
  // Combine pairs into 64-byte arrays for batch processing
  const combined64s: Uint8Array[] = pairs.map(({ left, right }) => {
    const buf = new Uint8Array(64);
    buf.set(left, 0);
    buf.set(right, 32);
    return buf;
  });
  
  const results: Uint8Array[] = [];
  
  // Process in batches of 4 for optimal SIMD performance
  for (let i = 0; i < combined64s.length; i += 4) {
    const batch = combined64s.slice(i, i + 4);
    
    if (batch.length === 4) {
      // Use optimized batch function for 4 pairs
      const batchResults = batchHash4UintArray64s(batch);
      results.push(...batchResults);
    } else {
      // Process remaining pairs individually
      for (const combined of batch) {
        const left = combined.subarray(0, 32);
        const right = combined.subarray(32, 64);
        results.push(hashParentWasm(left, right));
      }
    }
  }
  
  return results;
}

/**
 * Merkleization using WASM-accelerated hashing
 */
export function computeRootFromChunksWasm(chunks: Uint8Array[]): Uint8Array {
  if (chunks.length === 0) {
    return new Uint8Array(32); // Zero hash
  }
  if (chunks.length === 1) {
    return chunks[0];
  }

  // Stack-based merkleization (same algorithm as sync version)
  const stack: Uint8Array[] = [];
  let height = 0;

  for (const chunk of chunks) {
    let node = chunk;
    let h = 0;
    
    while (h < height && stack.length > 0) {
      const stackHeight = stack.length - 1;
      if (stackHeight !== h) break;
      
      const left = stack.pop()!;
      node = hashParentWasm(left, node);
      h++;
    }
    
    stack.push(node);
    if (h >= height) {
      height = h + 1;
    }
  }

  // Merge remaining stack
  while (stack.length > 1) {
    const right = stack.pop()!;
    const left = stack.pop()!;
    const parent = hashParentWasm(left, right);
    stack.push(parent);
  }

  return stack[0];
}

/**
 * Check if WASM acceleration is available
 */
export function isWasmAvailable(): boolean {
  try {
    // Test if we can call digest
    const test = new Uint8Array(32);
    digest(test);
    return true;
  } catch {
    return false;
  }
}
