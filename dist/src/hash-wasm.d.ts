/**
 * WASM-accelerated SHA-256 using @chainsafe/as-sha256
 * Synchronous, ~10-20x faster than pure TypeScript
 */
/**
 * Hash a single 32-byte chunk using WASM
 * ~10-20x faster than pure TypeScript
 */
export declare function hashLeafWasm(chunk32: Uint8Array): Uint8Array;
/**
 * Hash parent node (64 bytes) using WASM
 * ~10-20x faster than pure TypeScript
 * Uses optimized digest2Bytes32 for two 32-byte inputs
 */
export declare function hashParentWasm(left32: Uint8Array, right32: Uint8Array): Uint8Array;
/**
 * Batch hash multiple parent nodes using optimized WASM
 * Uses batchHash4UintArray64s for maximum performance (hashes 4 pairs in parallel)
 */
export declare function hashParentBatchWasm(pairs: Array<{
    left: Uint8Array;
    right: Uint8Array;
}>): Uint8Array[];
/**
 * Merkleization using WASM-accelerated hashing
 */
export declare function computeRootFromChunksWasm(chunks: Uint8Array[]): Uint8Array;
/**
 * Check if WASM acceleration is available
 */
export declare function isWasmAvailable(): boolean;
