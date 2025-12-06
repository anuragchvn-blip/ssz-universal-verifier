import { hashLeaf, hashParent } from './hash.js';
import { SszError } from './types.js';

/* Incremental merkleizer: stack-based binary carry algorithm */
/* invariant: stack heights strictly increasing bottom->top; merging identical heights reduces stack depth */

interface StackEntry {
  hash: Uint8Array;
  height: number;
}

export function computeRootFromChunks(
  chunkGen: Generator<Uint8Array | { error: SszError; msg: string }>,
  mixinLength?: number
): { root: Uint8Array } | { error: SszError; msg: string } {
  const stack: StackEntry[] = [];
  let count = 0;

  for (const item of chunkGen) {
    if ('error' in item) return item;
    pushAndMerge(stack, { hash: item, height: 0 });
    count++;
  }

  if (stack.length === 0) {
    const zeroHash = new Uint8Array(32);
    if (mixinLength !== undefined) return { root: mixinLengthRoot(zeroHash, mixinLength) };
    return { root: zeroHash };
  }

  while (stack.length > 1) {
    const right = stack.pop()!;
    const left = stack.pop()!;
    const parent = hashParent(left.hash, right.hash);
    pushAndMerge(stack, { hash: parent, height: Math.max(left.height, right.height) + 1 });
  }

  let root = stack[0].hash;
  if (mixinLength !== undefined) {
    root = mixinLengthRoot(root, mixinLength);
  }

  return { root };
}

function pushAndMerge(stack: StackEntry[], entry: StackEntry): void {
  stack.push(entry);
  while (stack.length >= 2) {
    const top = stack[stack.length - 1];
    const below = stack[stack.length - 2];
    if (below.height !== top.height) break;
    stack.pop();
    stack.pop();
    const parent = hashParent(below.hash, top.hash);
    stack.push({ hash: parent, height: below.height + 1 });
  }
}

function mixinLengthRoot(root: Uint8Array, length: number): Uint8Array {
  const lengthBuf = new Uint8Array(32);
  lengthBuf[0] = length & 0xff;
  lengthBuf[1] = (length >>> 8) & 0xff;
  lengthBuf[2] = (length >>> 16) & 0xff;
  lengthBuf[3] = (length >>> 24) & 0xff;
  return hashParent(root, lengthBuf);
}
