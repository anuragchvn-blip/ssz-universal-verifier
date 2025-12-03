/**
 * Worker thread for parallel merkleization
 * Processes a subtree and returns the root
 */
declare const parentPort: any, workerData: any;
declare const sha256: any;
interface WorkerData {
    chunks: Uint8Array[];
    taskId: number;
}
declare function computeRoot(chunks: Uint8Array[]): Uint8Array;
declare const chunks: Uint8Array<ArrayBufferLike>[], taskId: number;
declare const root: Uint8Array<ArrayBufferLike>;
