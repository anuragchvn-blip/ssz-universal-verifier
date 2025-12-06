"use strict";
/**
 * Worker thread for parallel merkleization
 * Processes a subtree and returns the root
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { parentPort, workerData } = require('worker_threads');
const hash_js_1 = require("./hash.js");
function computeRoot(chunks) {
    if (chunks.length === 0)
        return new Uint8Array(32);
    if (chunks.length === 1)
        return chunks[0];
    let currentLevel = [...chunks];
    while (currentLevel.length > 1) {
        const nextLevel = [];
        let i = 0;
        while (i + 7 < currentLevel.length) {
            const batch = [];
            for (let j = 0; j < 4; j++) {
                const combined = new Uint8Array(64);
                combined.set(currentLevel[i + j * 2], 0);
                combined.set(currentLevel[i + j * 2 + 1], 32);
                batch.push(combined);
            }
            for (const combined of batch) {
                const left = combined.subarray(0, 32);
                const right = combined.subarray(32, 64);
                nextLevel.push((0, hash_js_1.hashParent)(left, right));
            }
            i += 8;
        }
        while (i + 1 < currentLevel.length) {
            const parent = (0, hash_js_1.hashParent)(currentLevel[i], currentLevel[i + 1]);
            nextLevel.push(parent);
            i += 2;
        }
        if (i < currentLevel.length) {
            nextLevel.push(currentLevel[i]);
        }
        currentLevel = nextLevel;
    }
    return currentLevel[0];
}
// Process the subtree
const { chunks, taskId } = workerData;
const root = computeRoot(chunks);
// Send result back to main thread
parentPort?.postMessage({ root, taskId });
//# sourceMappingURL=merkle-worker.js.map