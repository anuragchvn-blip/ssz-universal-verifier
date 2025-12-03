"use strict";
/* WebCrypto SHA-256: Hardware-accelerated, 5-10x faster than pure TypeScript */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashLeafAsync = hashLeafAsync;
exports.hashParentAsync = hashParentAsync;
exports.hashParentBatchAsync = hashParentBatchAsync;
exports.computeRootFromChunksAsync = computeRootFromChunksAsync;
exports.isWebCryptoAvailable = isWebCryptoAvailable;
exports.getWebCryptoInfo = getWebCryptoInfo;
// Detect environment
const isNode = typeof process !== 'undefined' && process.versions?.node;
const isBrowser = typeof window !== 'undefined' && typeof window.crypto !== 'undefined';
// Get crypto implementation
const cryptoImpl = (() => {
    if (isBrowser) {
        return window.crypto.subtle;
    }
    else if (isNode) {
        // Node.js 15+ has global crypto
        if (typeof globalThis.crypto !== 'undefined') {
            return globalThis.crypto.subtle;
        }
        // Fallback to require('crypto').webcrypto for older Node
        try {
            const { webcrypto } = require('crypto');
            return webcrypto.subtle;
        }
        catch {
            return null;
        }
    }
    return null;
})();
const hasWebCrypto = cryptoImpl !== null;
/**
 * Async WebCrypto SHA-256 for single chunk (32 bytes)
 * ~5-10x faster than pure TypeScript implementation
 */
async function hashLeafAsync(chunk32) {
    if (!hasWebCrypto) {
        throw new Error('WebCrypto not available');
    }
    const hashBuffer = await cryptoImpl.digest('SHA-256', chunk32);
    return new Uint8Array(hashBuffer);
}
/**
 * Async WebCrypto SHA-256 for parent node (64 bytes)
 * ~5-10x faster than pure TypeScript implementation
 */
async function hashParentAsync(left32, right32) {
    if (!hasWebCrypto) {
        throw new Error('WebCrypto not available');
    }
    const combined = new Uint8Array(64);
    combined.set(left32, 0);
    combined.set(right32, 32);
    const hashBuffer = await cryptoImpl.digest('SHA-256', combined);
    return new Uint8Array(hashBuffer);
}
/**
 * Batch hash multiple parent nodes using WebCrypto
 * Processes in parallel for maximum throughput
 */
async function hashParentBatchAsync(pairs) {
    if (!hasWebCrypto) {
        throw new Error('WebCrypto not available');
    }
    return Promise.all(pairs.map(({ left, right }) => hashParentAsync(left, right)));
}
/**
 * Async merkleization using WebCrypto
 * Binary tree reduction with hardware acceleration
 */
async function computeRootFromChunksAsync(chunks) {
    if (!hasWebCrypto) {
        throw new Error('WebCrypto not available');
    }
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
            node = await hashParentAsync(left, node);
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
        const parent = await hashParentAsync(left, right);
        stack.push(parent);
    }
    return stack[0];
}
/**
 * Check if WebCrypto is available in current environment
 */
function isWebCryptoAvailable() {
    return hasWebCrypto;
}
/**
 * Get WebCrypto implementation info for debugging
 */
function getWebCryptoInfo() {
    if (!hasWebCrypto) {
        return 'WebCrypto: Not available';
    }
    if (isBrowser) {
        return 'WebCrypto: Browser (window.crypto.subtle)';
    }
    if (isNode) {
        return 'WebCrypto: Node.js (globalThis.crypto.subtle or webcrypto)';
    }
    return 'WebCrypto: Available (unknown environment)';
}
