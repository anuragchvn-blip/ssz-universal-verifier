/**
 * Optimized WASM merkleizer with batch processing
 * Goal: Achieve 3M+ hash operations per second in tree context
 */
/**
 * Optimized merkleization using batch operations
 * Processes tree levels in batches of 4 for SIMD optimization
 */
export declare function computeRootFromChunksOptimized(chunks: Uint8Array[]): Uint8Array;
/**
 * Benchmark: Merkleization throughput (hash operations per second)
 */
export declare function benchmarkMerkleizationThroughput(): void;
//# sourceMappingURL=merkle-optimized.d.ts.map