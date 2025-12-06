/**
 * SHA-256 hashing using our own pure TypeScript implementation
 * Independent of external dependencies
 */
/**
 * Hash a single 32-byte chunk
 * Uses our own pure TypeScript SHA-256
 */
export declare function hashLeafWasm(chunk32: Uint8Array): Uint8Array;
/**
 * Hash parent node (64 bytes)
 * Uses our own pure TypeScript SHA-256
 */
export declare function hashParentWasm(left32: Uint8Array, right32: Uint8Array): Uint8Array;
/**
 * Batch hash multiple parent nodes using WASM
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
 * Currently using pure TypeScript implementation
 */
export declare function isWasmAvailable(): boolean;
//# sourceMappingURL=hash-wasm.d.ts.map