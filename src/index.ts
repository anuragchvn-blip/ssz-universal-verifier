import { TypeDesc, TypeKind, SszError } from './types.js';
import { parseToRanges } from './sszParser.js';
import { streamChunksFromSlice, streamChunksFromReader } from './chunker.js';
import { computeRootFromChunks } from './merkle.js';

export { TypeDesc, TypeKind, SszError };

export function sszStreamRootFromSlice(
  td: TypeDesc,
  bytes: Uint8Array
): { root: Uint8Array } | { error: SszError, msg: string } {
  const parsed = parseToRanges(td, bytes);
  if (parsed.error !== SszError.None) return { error: parsed.error, msg: parsed.msg };

  const chunkGen = streamChunksFromSlice(bytes, parsed.ranges);
  let mixinLength: number | undefined = undefined;
  
  if (td.kind === TypeKind.List) {
    mixinLength = parsed.ranges.length;
  } else if (td.kind === TypeKind.Bitlist && bytes.length > 0) {
    const lastByte = bytes[bytes.length - 1];
    let bitLen = (bytes.length - 1) * 8;
    let sentinel = lastByte;
    while (sentinel > 1) { bitLen++; sentinel >>= 1; }
    mixinLength = bitLen;
  }

  return computeRootFromChunks(chunkGen, mixinLength);
}

export function sszStreamRootFromReader(
  td: TypeDesc,
  reader: (buf: Uint8Array) => number
): { root: Uint8Array } | { error: SszError, msg: string } {
  const tempBuf = new Uint8Array(8192);
  let allBytes = new Uint8Array(0);
  
  while (true) {
    const n = reader(tempBuf);
    if (n === 0) break;
    const newAll = new Uint8Array(allBytes.length + n);
    newAll.set(allBytes, 0);
    newAll.set(tempBuf.subarray(0, n), allBytes.length);
    allBytes = newAll;
  }

  return sszStreamRootFromSlice(td, allBytes);
}
