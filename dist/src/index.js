"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SszError = exports.TypeKind = void 0;
exports.sszStreamRootFromSlice = sszStreamRootFromSlice;
exports.sszStreamRootFromReader = sszStreamRootFromReader;
const types_js_1 = require("./types.js");
Object.defineProperty(exports, "TypeKind", { enumerable: true, get: function () { return types_js_1.TypeKind; } });
Object.defineProperty(exports, "SszError", { enumerable: true, get: function () { return types_js_1.SszError; } });
const sszParser_js_1 = require("./sszParser.js");
const chunker_js_1 = require("./chunker.js");
const merkle_js_1 = require("./merkle.js");
function sszStreamRootFromSlice(td, bytes) {
    const parsed = (0, sszParser_js_1.parseToRanges)(td, bytes);
    if (parsed.error !== types_js_1.SszError.None)
        return { error: parsed.error, msg: parsed.msg };
    const chunkGen = (0, chunker_js_1.streamChunksFromSlice)(bytes, parsed.ranges);
    let mixinLength = undefined;
    if (td.kind === types_js_1.TypeKind.List) {
        mixinLength = parsed.ranges.length;
    }
    else if (td.kind === types_js_1.TypeKind.Bitlist && bytes.length > 0) {
        const lastByte = bytes[bytes.length - 1];
        let bitLen = (bytes.length - 1) * 8;
        let sentinel = lastByte;
        while (sentinel > 1) {
            bitLen++;
            sentinel >>= 1;
        }
        mixinLength = bitLen;
    }
    return (0, merkle_js_1.computeRootFromChunks)(chunkGen, mixinLength);
}
function sszStreamRootFromReader(td, reader) {
    const tempBuf = new Uint8Array(8192);
    let allBytes = new Uint8Array(0);
    while (true) {
        const n = reader(tempBuf);
        if (n === 0)
            break;
        const newAll = new Uint8Array(allBytes.length + n);
        newAll.set(allBytes, 0);
        newAll.set(tempBuf.subarray(0, n), allBytes.length);
        allBytes = newAll;
    }
    return sszStreamRootFromSlice(td, allBytes);
}
