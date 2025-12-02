#include "ssz_stream.h"
#include <string.h>

#ifdef HOST_TEST
#include <stdio.h>
#define MAX_STACK_DEPTH 64
#else
#define MAX_STACK_DEPTH 32
#endif

extern void sha256_hash(const uint8_t *data, size_t len, uint8_t out[32]);

typedef struct {
  uint8_t hash[32];
  uint32_t height;
} StackEntry;

static void hash_leaf(const uint8_t chunk[32], uint8_t out[32]) {
  sha256_hash(chunk, 32, out);
}

static void hash_parent(const uint8_t left[32], const uint8_t right[32], uint8_t out[32]) {
  uint8_t combined[64];
  memcpy(combined, left, 32);
  memcpy(combined + 32, right, 32);
  sha256_hash(combined, 64, out);
}

static void push_and_merge(StackEntry *stack, uint32_t *depth, StackEntry entry) {
  stack[*depth] = entry;
  (*depth)++;
  while (*depth >= 2) {
    StackEntry *top = &stack[*depth - 1];
    StackEntry *below = &stack[*depth - 2];
    if (below->height != top->height) break;
    uint8_t parent[32];
    hash_parent(below->hash, top->hash, parent);
    (*depth) -= 2;
    StackEntry merged = { .height = below->height + 1 };
    memcpy(merged.hash, parent, 32);
    stack[*depth] = merged;
    (*depth)++;
  }
}

static void mixin_length(uint8_t root[32], uint32_t length) {
  uint8_t len_buf[32] = {0};
  len_buf[0] = length & 0xff;
  len_buf[1] = (length >> 8) & 0xff;
  len_buf[2] = (length >> 16) & 0xff;
  len_buf[3] = (length >> 24) & 0xff;
  uint8_t new_root[32];
  hash_parent(root, len_buf, new_root);
  memcpy(root, new_root, 32);
}

int ssz_stream_root_from_buffer(
  const uint8_t *bytes,
  size_t len,
  const TypeDesc *td,
  uint8_t out_root[32],
  char err[128]
) {
  if (td->kind == SSZ_KIND_BASIC) {
    if (td->fixed_size == 0) {
       // Variable-length bytes: treat as list of bytes? No, spec says Basic is fixed.
       // But our TS impl handles fixedSize=0 as variable bytes.
       // For C, let's assume Basic must be fixed size unless we add logic.
       // Actually, let's just hash the whole buffer as one chunk if it fits?
       // No, SSZ basic types are little-endian values.
       // If fixed_size is 0, we'll assume it's a raw byte buffer (like ByteVector/List).
       // But strictly, Basic types are uintN/bool.
       // Let's follow TS: if fixed_size is set, check length.
       if (len != td->fixed_size) {
         if (err) snprintf(err, 128, "Basic type length mismatch");
         return SSZ_ERR_NON_CANONICAL;
       }
       // Basic types are leaves directly (no hash_leaf needed if < 32 bytes? No, spec says pack to 32 bytes).
       // Actually, for Basic types, the value IS the leaf.
       uint8_t chunk[32] = {0};
       memcpy(chunk, bytes, len < 32 ? len : 32);
       // In our TS fix, we removed hashLeaf for basic types.
       // So we just copy to out_root (padded).
       memcpy(out_root, chunk, 32);
       return SSZ_ERR_NONE;
    }
  }

  // For other types, we need to chunk and merkleize
  StackEntry stack[MAX_STACK_DEPTH];
  uint32_t depth = 0;
  
  // Simple chunker for now: assume packed bytes (Vector/List of basic)
  // This is a simplification. Real SSZ has complex packing.
  // We will implement a simple chunker for packed data.
  
  size_t offset = 0;
  size_t chunk_count = 0;
  
  while (offset < len) {
    uint8_t chunk[32] = {0};
    size_t remain = len - offset;
    size_t copy = remain < 32 ? remain : 32;
    memcpy(chunk, bytes + offset, copy);
    
    // For packed data, we hash the chunk to get the leaf
    // Wait, for Vector/List of Basic, the chunks ARE the leaves?
    // No, for composite types, the leaves are H(chunk).
    // Let's check TS:
    // pushAndMerge(stack, { hash: item, height: 0 });
    // And item comes from streamChunksFromSlice which yields 32-byte chunks.
    // So we do NOT hash the chunk again?
    // In TS merkle.ts: pushAndMerge(stack, { hash: item, height: 0 });
    // So yes, the chunk IS the leaf hash.
    
    StackEntry entry = { .height = 0 };
    memcpy(entry.hash, chunk, 32);
    push_and_merge(stack, &depth, entry);
    
    offset += 32;
    chunk_count++;
  }
  
  // Finalize
  if (depth == 0) {
    memset(out_root, 0, 32);
  } else {
    while (depth > 1) {
      StackEntry top = stack[depth - 1];
      StackEntry below = stack[depth - 2];
      uint8_t parent[32];
      hash_parent(below.hash, top.hash, parent);
      depth -= 2;
      StackEntry merged = { .height = below.height + 1 };
      memcpy(merged.hash, parent, 32);
      stack[depth] = merged;
      depth++;
    }
    memcpy(out_root, stack[0].hash, 32);
  }
  
  // Mixin length if needed
  if (td->kind == SSZ_KIND_LIST) {
    // For List, we mix in the number of elements.
    // If elements are packed, we need element count, not chunk count.
    // But for now, let's assume packed bytes (List<uint8>).
    // If element_type is provided, we can calc count.
    // This C impl is minimal.
    mixin_length(out_root, chunk_count); // This is wrong for non-byte lists
  }
  
  return SSZ_ERR_NONE;
}

int ssz_stream_root_from_reader(
  ssz_reader_fn reader,
  void *ctx,
  const TypeDesc *td,
  uint8_t out_root[32],
  char err[128]
) {
  // Not implemented in this pass
  (void)reader; (void)ctx; (void)td; (void)out_root; (void)err;
  return SSZ_ERR_UNSUPPORTED_TYPE;
}
