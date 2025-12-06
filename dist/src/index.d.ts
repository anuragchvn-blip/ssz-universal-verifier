import { TypeDesc, TypeKind, SszError } from './types.js';
export type { TypeDesc };
export { TypeKind, SszError };
export declare function sszStreamRootFromSlice(td: TypeDesc, bytes: Uint8Array): {
    root: Uint8Array;
} | {
    error: SszError;
    msg: string;
};
export declare function sszStreamRootFromReader(td: TypeDesc, reader: (buf: Uint8Array) => number): {
    root: Uint8Array;
} | {
    error: SszError;
    msg: string;
};
//# sourceMappingURL=index.d.ts.map