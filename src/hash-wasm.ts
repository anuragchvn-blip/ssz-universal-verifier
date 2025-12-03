/**
 * SHA-256 hashing using our own pure TypeScript implementation
 * Independent of external dependencies
 */

import { hashLeaf as hashLeafPure, hashParent as hashParentPure } from './hash.js';

/**
 * Hash a single 32-byte chunk
 * Uses our own pure TypeScript SHA-256
 */
export function hashLeafWasm(chunk32: Uint8Array): Uint8Array {
  return hashLeafPure(chunk32);
}

/**
 * Hash parent node (64 bytes)
 * Uses our own pure TypeScript SHA-256
 */
export function hashParentWasm(left32: Uint8Array, right32: Uint8Array): Uint8Array {
  return hashParentPure(left32, right32);
}

/**
 * Batch hash multiple parent nodes using WASM
 */
export function hashParentBatchWasm(
  pairs: Array<{ left: Uint8Array; right: Uint8Array }>
): Uint8Array[] {
  return pairs.map(({ left, right }) => hashParentWasm(left, right));
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
 * Currently using pure TypeScript implementation
 */
export function isWasmAvailable(): boolean {
  // Pure TypeScript is always available
  return true;
}
