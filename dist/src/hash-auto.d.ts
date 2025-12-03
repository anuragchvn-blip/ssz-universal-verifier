/**
 * Auto-detect best SHA-256 implementation
 * Priority: Native addon > Our WASM > Pure TypeScript
 */
export declare const hashLeaf: Function;
export declare const hashParent: Function;
export declare const getHashImplementation: () => string;
/**
 * Check if we're using native implementation
 */
export declare function isNative(): boolean;
/**
 * Check if we're using our WASM
 */
export declare function isWasm(): boolean;
/**
 * Check if we're using pure TypeScript
 */
export declare function isPureTS(): boolean;
