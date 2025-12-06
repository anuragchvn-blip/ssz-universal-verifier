import { SszError } from './types.js';
export declare function computeRootFromChunks(chunkGen: Generator<Uint8Array | {
    error: SszError;
    msg: string;
}>, mixinLength?: number): {
    root: Uint8Array;
} | {
    error: SszError;
    msg: string;
};
//# sourceMappingURL=merkle.d.ts.map