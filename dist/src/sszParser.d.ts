import { TypeDesc, SszError, Range } from './types.js';
export declare function parseToRanges(td: TypeDesc, bytes: Uint8Array): {
    ranges: Range[];
    error: SszError;
    msg: string;
};
//# sourceMappingURL=sszParser.d.ts.map