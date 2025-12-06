/**
 * Auto-detect best SHA-256 implementation
 * Priority: Native addon > Our WASM > Pure TypeScript
 */

let hashImpl: { hashLeaf: Function; hashParent: Function; info: string };

try {
  // Try native addon first (5-10M ops/sec with SHA-NI)
  const native = require('../native/build/Release/ssz_native.node');
  hashImpl = {
    hashLeaf: native.hashLeaf,
    hashParent: native.hashParent,
    info: `Native: ${native.getImplementation()} (${native.hasNativeSupport() ? 'Hardware accelerated' : 'Software fallback'})`,
  };
  console.log(`✅ Using native SHA-256: ${hashImpl.info}`);
} catch (nativeError) {
  try {
    // Fall back to our own WASM (compiled from wasm/src/hash_simd.rs)
    const wasm = require('./wasm/pkg');
    hashImpl = {
      hashLeaf: (chunk: Uint8Array) => {
        const result = wasm.hash_leaf_simd(chunk);
        if (result.error) throw new Error(result.error);
        return result;
      },
      hashParent: (left: Uint8Array, right: Uint8Array) => {
        const result = wasm.hash_parent_simd(left, right);
        if (result.error) throw new Error(result.error);
        return result;
      },
      info: 'Our WASM with SIMD (from wasm/src/hash_simd.rs)',
    };
    console.log(`⚠️  Native addon not available, using WASM fallback`);
  } catch (wasmError) {
    // Final fallback to pure TypeScript
    const pureSHA = require('./hash');
    hashImpl = {
      hashLeaf: pureSHA.hashLeaf,
      hashParent: pureSHA.hashParent,
      info: 'Pure TypeScript (slowest)',
    };
    console.log(`⚠️  WASM not available, using pure TypeScript (slowest)`);
  }
}

export const hashLeaf = hashImpl.hashLeaf;
export const hashParent = hashImpl.hashParent;
export const getHashImplementation = () => hashImpl.info;

/**
 * Check if we're using native implementation
 */
export function isNative(): boolean {
  return hashImpl.info.startsWith('Native');
}

/**
 * Check if we're using our WASM
 */
export function isWasm(): boolean {
  return hashImpl.info.includes('WASM');
}

/**
 * Check if we're using pure TypeScript
 */
export function isPureTS(): boolean {
  return hashImpl.info.includes('TypeScript');
}
