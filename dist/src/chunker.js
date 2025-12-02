"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamChunksFromSlice = streamChunksFromSlice;
exports.streamChunksFromReader = streamChunksFromReader;
const types_js_1 = require("./types.js");
/* Streaming 32-byte chunk producer: slice-based and reader-based APIs */
function* streamChunksFromSlice(bytes, ranges) {
    for (const range of ranges) {
        const len = range.end - range.start;
        let offset = range.start;
        while (offset < range.end) {
            const chunk = new Uint8Array(32);
            const remain = range.end - offset;
            const toCopy = Math.min(32, remain);
            chunk.set(bytes.subarray(offset, offset + toCopy), 0);
            yield chunk;
            offset += 32;
        }
    }
}
function* streamChunksFromReader(reader, ranges) {
    const tempBuf = new Uint8Array(4096);
    let tempOffset = 0;
    let tempLen = 0;
    for (const range of ranges) {
        const rangeLen = range.end - range.start;
        let consumed = 0;
        while (consumed < rangeLen) {
            if (tempOffset >= tempLen) {
                tempOffset = 0;
                tempLen = reader(tempBuf);
                if (tempLen === 0) {
                    yield { error: types_js_1.SszError.UnexpectedEOF, msg: 'Reader EOF mid-range' };
                    return;
                }
            }
            const chunk = new Uint8Array(32);
            let chunkOffset = 0;
            const needForChunk = Math.min(32, rangeLen - consumed);
            while (chunkOffset < needForChunk && tempOffset < tempLen) {
                const avail = tempLen - tempOffset;
                const copy = Math.min(needForChunk - chunkOffset, avail);
                chunk.set(tempBuf.subarray(tempOffset, tempOffset + copy), chunkOffset);
                chunkOffset += copy;
                tempOffset += copy;
                consumed += copy;
            }
            if (chunkOffset < needForChunk && tempOffset >= tempLen) {
                tempOffset = 0;
                tempLen = reader(tempBuf);
                if (tempLen === 0) {
                    yield { error: types_js_1.SszError.UnexpectedEOF, msg: 'Reader EOF within chunk' };
                    return;
                }
            }
            yield chunk;
        }
    }
}
