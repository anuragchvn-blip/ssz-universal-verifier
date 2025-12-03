/**
 * Multi-threaded merkleizer using Worker Threads
 * Path to 3M+ ops/sec on older hardware
 */
/**
 * Parallel merkleization using worker threads
 * Splits tree into subtrees, processes in parallel, combines results
 */
export declare function computeRootFromChunksParallel(chunks: Uint8Array[], numThreads?: number): Promise<Uint8Array>;
/**
 * Benchmark parallel merkleization
 */
export declare function benchmarkParallelMerkleization(): Promise<void>;
