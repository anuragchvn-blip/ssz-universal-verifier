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
    /* Basic types (uintN, bool) - validate fixed size and return padded chunk */
    if (td->fixed_size > 0) {
      if (len != td->fixed_size) {
        if (err) snprintf(err, 128, "Basic type length mismatch: expected %u, got %zu", td->fixed_size, len);
        return SSZ_ERR_NON_CANONICAL;
      }
    }
    /* SSZ Basic types: the serialized bytes ARE the merkle leaf (zero-padded to 32 bytes) */
    uint8_t chunk[32] = {0};
    size_t copy_len = (len < 32) ? len : 32;
    memcpy(chunk, bytes, copy_len);
    memcpy(out_root, chunk, 32);
    return SSZ_ERR_NONE;
  }

  /* For composite types (Vector/List/Container), chunk and merkleize */
  StackEntry stack[MAX_STACK_DEPTH];
  uint32_t depth = 0;
  
  /* Calculate element count and chunk size based on type */
  size_t elem_size = 1; /* Default: byte elements */
  size_t elem_count = len;
  
  if (td->element_type != NULL) {
    const TypeDesc *elem_td = (const TypeDesc *)td->element_type;
    if (elem_td->fixed_size > 0) {
      elem_size = elem_td->fixed_size;
      elem_count = len / elem_size;
    }
  }
  
  /* Chunk data: pack elements into 32-byte chunks */
  size_t offset = 0;
  size_t chunk_count = 0;
  
  while (offset < len) {
    uint8_t chunk[32] = {0};
    size_t remain = len - offset;
    size_t copy = (remain < 32) ? remain : 32;
    memcpy(chunk, bytes + offset, copy);
    
    /* SSZ spec: for composite types, chunks ARE the leaf hashes (no additional hashing) */
    StackEntry entry = { .height = 0 };
    memcpy(entry.hash, chunk, 32);
    push_and_merge(stack, &depth, entry);
    
    offset += 32;
    chunk_count++;
  }
  
  /* Finalize merkleization */
  if (depth == 0) {
    /* Empty data: root is zero hash */
    memset(out_root, 0, 32);
  } else {
    /* Collapse remaining stack entries */
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
  
  /* Mix in length for List types (element count, not chunk count) */
  if (td->kind == SSZ_KIND_LIST) {
    mixin_length(out_root, (uint32_t)elem_count);
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
