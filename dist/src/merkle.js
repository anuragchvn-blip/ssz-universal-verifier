"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeRootFromChunks = computeRootFromChunks;
const hash_js_1 = require("./hash.js");
function computeRootFromChunks(chunkGen, mixinLength) {
    const stack = [];
    let count = 0;
    for (const item of chunkGen) {
        if ('error' in item)
            return item;
        pushAndMerge(stack, { hash: item, height: 0 });
        count++;
    }
    if (stack.length === 0) {
        const zeroHash = new Uint8Array(32);
        if (mixinLength !== undefined)
            return { root: mixinLengthRoot(zeroHash, mixinLength) };
        return { root: zeroHash };
    }
    while (stack.length > 1) {
        const right = stack.pop();
        const left = stack.pop();
        const parent = (0, hash_js_1.hashParent)(left.hash, right.hash);
        pushAndMerge(stack, { hash: parent, height: Math.max(left.height, right.height) + 1 });
    }
    let root = stack[0].hash;
    if (mixinLength !== undefined) {
        root = mixinLengthRoot(root, mixinLength);
    }
    return { root };
}
function pushAndMerge(stack, entry) {
    stack.push(entry);
    while (stack.length >= 2) {
        const top = stack[stack.length - 1];
        const below = stack[stack.length - 2];
        if (below.height !== top.height)
            break;
        stack.pop();
        stack.pop();
        const parent = (0, hash_js_1.hashParent)(below.hash, top.hash);
        stack.push({ hash: parent, height: below.height + 1 });
    }
}
function mixinLengthRoot(root, length) {
    const lengthBuf = new Uint8Array(32);
    lengthBuf[0] = length & 0xff;
    lengthBuf[1] = (length >>> 8) & 0xff;
    lengthBuf[2] = (length >>> 16) & 0xff;
    lengthBuf[3] = (length >>> 24) & 0xff;
    return (0, hash_js_1.hashParent)(root, lengthBuf);
}
//# sourceMappingURL=merkle.js.map