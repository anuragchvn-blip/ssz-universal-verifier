"use strict";
/**
 * SHA-256 hashing using our own pure TypeScript implementation
 * Independent of external dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashLeafWasm = hashLeafWasm;
exports.hashParentWasm = hashParentWasm;
exports.hashParentBatchWasm = hashParentBatchWasm;
exports.computeRootFromChunksWasm = computeRootFromChunksWasm;
exports.isWasmAvailable = isWasmAvailable;
const hash_js_1 = require("./hash.js");
/**
 * Hash a single 32-byte chunk
 * Uses our own pure TypeScript SHA-256
 */
function hashLeafWasm(chunk32) {
    return (0, hash_js_1.hashLeaf)(chunk32);
}
/**
 * Hash parent node (64 bytes)
 * Uses our own pure TypeScript SHA-256
 */
function hashParentWasm(left32, right32) {
    return (0, hash_js_1.hashParent)(left32, right32);
}
/**
 * Batch hash multiple parent nodes using WASM
 */
function hashParentBatchWasm(pairs) {
    return pairs.map(({ left, right }) => hashParentWasm(left, right));
}
/**
 * Merkleization using WASM-accelerated hashing
 */
function computeRootFromChunksWasm(chunks) {
    if (chunks.length === 0) {
        return new Uint8Array(32); // Zero hash
    }
    if (chunks.length === 1) {
        return chunks[0];
    }
    // Stack-based merkleization (same algorithm as sync version)
    const stack = [];
    let height = 0;
    for (const chunk of chunks) {
        let node = chunk;
        let h = 0;
        while (h < height && stack.length > 0) {
            const stackHeight = stack.length - 1;
            if (stackHeight !== h)
                break;
            const left = stack.pop();
            node = hashParentWasm(left, node);
            h++;
        }
        stack.push(node);
        if (h >= height) {
            height = h + 1;
        }
    }
    // Merge remaining stack
    while (stack.length > 1) {
        const right = stack.pop();
        const left = stack.pop();
        const parent = hashParentWasm(left, right);
        stack.push(parent);
    }
    return stack[0];
}
/**
 * Check if WASM acceleration is available
 * Currently using pure TypeScript implementation
 */
function isWasmAvailable() {
    // Pure TypeScript is always available
    return true;
}
//# sourceMappingURL=hash-wasm.js.map