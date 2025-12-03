#ifndef SSZ_SHA256_NATIVE_H
#define SSZ_SHA256_NATIVE_H

#include <cstdint>
#include <cstddef>

namespace ssz_native {

// SHA-256 implementation using hardware acceleration when available
// Falls back to software implementation if hardware not supported

// Single hash: data -> 32-byte digest
void sha256_hash(const uint8_t* data, size_t len, uint8_t* out);

// Dual hash: (left || right) -> 32-byte digest (optimized for merkle trees)
void sha256_hash_pair(const uint8_t left[32], const uint8_t right[32], uint8_t* out);

// Check if hardware SHA extensions are available
bool has_sha_extensions();

// Get implementation name for benchmarking
const char* get_implementation_name();

} // namespace ssz_native

#endif // SSZ_SHA256_NATIVE_H
