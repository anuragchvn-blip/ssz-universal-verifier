import { Range, SszError } from './types.js';
export declare function streamChunksFromSlice(bytes: Uint8Array, ranges: Range[]): Generator<Uint8Array>;
export declare function streamChunksFromReader(reader: (buf: Uint8Array) => number, ranges: Range[]): Generator<Uint8Array | {
    error: SszError;
    msg: string;
}>;
//# sourceMappingURL=chunker.d.ts.map