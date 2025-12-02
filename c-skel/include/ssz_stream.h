#ifndef SSZ_STREAM_H
#define SSZ_STREAM_H

#include <stdint.h>
#include <stddef.h>

/* Core SSZ streaming verifier: no_std friendly C API */

typedef enum {
  SSZ_KIND_BASIC = 0,
  SSZ_KIND_VECTOR = 1,
  SSZ_KIND_LIST = 2,
  SSZ_KIND_CONTAINER = 3,
  SSZ_KIND_BITLIST = 4
} TypeKind;

typedef enum {
  SSZ_ERR_NONE = 0,
  SSZ_ERR_BAD_OFFSET = 1,
  SSZ_ERR_NON_CANONICAL = 2,
  SSZ_ERR_BITLIST_PADDING = 3,
  SSZ_ERR_UNSUPPORTED_TYPE = 4,
  SSZ_ERR_MALFORMED_HEADER = 5,
  SSZ_ERR_LENGTH_OVERFLOW = 6,
  SSZ_ERR_UNEXPECTED_EOF = 7
} SszError;

typedef struct {
  TypeKind kind;
  uint32_t fixed_size;
  const void* element_type;
  const void** field_types;
  uint32_t field_count;
  uint32_t max_length;
} TypeDesc;

/* Main API */
int ssz_stream_root_from_buffer(
  const uint8_t *bytes,
  size_t len,
  const TypeDesc *td,
  uint8_t out_root[32],
  char err[128]
);

/* Reader callback: fill buf, return bytes read, 0 for EOF */
typedef size_t (*ssz_reader_fn)(uint8_t *buf, size_t buf_size, void *ctx);

int ssz_stream_root_from_reader(
  ssz_reader_fn reader,
  void *ctx,
  const TypeDesc *td,
  uint8_t out_root[32],
  char err[128]
);

#endif
