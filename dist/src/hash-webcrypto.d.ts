/**
 * Async WebCrypto SHA-256 for single chunk (32 bytes)
 * ~5-10x faster than pure TypeScript implementation
 */
export declare function hashLeafAsync(chunk32: Uint8Array): Promise<Uint8Array>;
/**
 * Async WebCrypto SHA-256 for parent node (64 bytes)
 * ~5-10x faster than pure TypeScript implementation
 */
export declare function hashParentAsync(left32: Uint8Array, right32: Uint8Array): Promise<Uint8Array>;
/**
 * Batch hash multiple parent nodes using WebCrypto
 * Processes in parallel for maximum throughput
 */
export declare function hashParentBatchAsync(pairs: Array<{
    left: Uint8Array;
    right: Uint8Array;
}>): Promise<Uint8Array[]>;
/**
 * Async merkleization using WebCrypto
 * Binary tree reduction with hardware acceleration
 */
export declare function computeRootFromChunksAsync(chunks: Uint8Array[]): Promise<Uint8Array>;
/**
 * Check if WebCrypto is available in current environment
 */
export declare function isWebCryptoAvailable(): boolean;
/**
 * Get WebCrypto implementation info for debugging
 */
export declare function getWebCryptoInfo(): string;
