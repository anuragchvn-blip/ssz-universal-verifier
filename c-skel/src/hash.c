#include <stdint.h>
#include <stddef.h>
#include <string.h>

// Minimal SHA-256 implementation for C
// Based on FIPS 180-4

#define ROTR(x, n) (((x) >> (n)) | ((x) << (32 - (n))))
#define CH(x, y, z) (((x) & (y)) ^ (~(x) & (z)))
#define MAJ(x, y, z) (((x) & (y)) ^ ((x) & (z)) ^ ((y) & (z)))
#define EP0(x) (ROTR(x, 2) ^ ROTR(x, 13) ^ ROTR(x, 22))
#define EP1(x) (ROTR(x, 6) ^ ROTR(x, 11) ^ ROTR(x, 25))
#define SIG0(x) (ROTR(x, 7) ^ ROTR(x, 18) ^ ((x) >> 3))
#define SIG1(x) (ROTR(x, 17) ^ ROTR(x, 19) ^ ((x) >> 10))

static const uint32_t K[64] = {
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
};

void sha256_hash(const uint8_t *data, size_t len, uint8_t out[32]) {
  uint32_t H[8] = {
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  };
  uint32_t W[64];
  uint8_t block[64];
  size_t offset = 0;
  size_t total_bits = len * 8;
  
  while (offset < len + 9 || (offset % 64) != 0) {
    memset(block, 0, 64);
    if (offset < len) {
      size_t copy = len - offset;
      if (copy > 64) copy = 64;
      memcpy(block, data + offset, copy);
      if (copy < 64) block[copy] = 0x80;
    } else if (offset == len) {
      block[0] = 0x80;
    }
    
    // Padding length
    if ((offset + 64) > len + 9 && (offset % 64) == 0) {
       // Last block with length
       // If we are here, we are padding
    }
    
    // This loop structure is tricky for single pass.
    // Let's simplify: process full blocks, then pad.
    break; 
  }
  
  // Re-implement simpler flow
  offset = 0;
  while (len - offset >= 64) {
    const uint8_t *p = data + offset;
    for (int i = 0; i < 16; i++) {
      W[i] = (p[i*4] << 24) | (p[i*4+1] << 16) | (p[i*4+2] << 8) | p[i*4+3];
    }
    for (int i = 16; i < 64; i++) W[i] = SIG1(W[i-2]) + W[i-7] + SIG0(W[i-15]) + W[i-16];
    
    uint32_t a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (int i = 0; i < 64; i++) {
      uint32_t t1 = h + EP1(e) + CH(e, f, g) + K[i] + W[i];
      uint32_t t2 = EP0(a) + MAJ(a, b, c);
      h = g; g = f; f = e; e = d + t1;
      d = c; c = b; b = a; a = t1 + t2;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
    offset += 64;
  }
  
  memset(block, 0, 64);
  memcpy(block, data + offset, len - offset);
  block[len - offset] = 0x80;
  if (len - offset >= 56) {
    // Process this block and create another
    const uint8_t *p = block;
    for (int i = 0; i < 16; i++) W[i] = (p[i*4] << 24) | (p[i*4+1] << 16) | (p[i*4+2] << 8) | p[i*4+3];
    for (int i = 16; i < 64; i++) W[i] = SIG1(W[i-2]) + W[i-7] + SIG0(W[i-15]) + W[i-16];
    uint32_t a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (int i = 0; i < 64; i++) {
      uint32_t t1 = h + EP1(e) + CH(e, f, g) + K[i] + W[i];
      uint32_t t2 = EP0(a) + MAJ(a, b, c);
      h = g; g = f; f = e; e = d + t1;
      d = c; c = b; b = a; a = t1 + t2;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
    memset(block, 0, 64);
  }
  
  // Append length
  // Note: we only support 32-bit length for this simple impl (size_t cast)
  // SSZ buffers are usually small in this context.
  uint64_t bitlen = (uint64_t)len * 8;
  block[56] = (bitlen >> 56) & 0xff;
  block[57] = (bitlen >> 48) & 0xff;
  block[58] = (bitlen >> 40) & 0xff;
  block[59] = (bitlen >> 32) & 0xff;
  block[60] = (bitlen >> 24) & 0xff;
  block[61] = (bitlen >> 16) & 0xff;
  block[62] = (bitlen >> 8) & 0xff;
  block[63] = bitlen & 0xff;
  
  const uint8_t *p = block;
  for (int i = 0; i < 16; i++) W[i] = (p[i*4] << 24) | (p[i*4+1] << 16) | (p[i*4+2] << 8) | p[i*4+3];
  for (int i = 16; i < 64; i++) W[i] = SIG1(W[i-2]) + W[i-7] + SIG0(W[i-15]) + W[i-16];
  uint32_t a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
  for (int i = 0; i < 64; i++) {
    uint32_t t1 = h + EP1(e) + CH(e, f, g) + K[i] + W[i];
    uint32_t t2 = EP0(a) + MAJ(a, b, c);
    h = g; g = f; f = e; e = d + t1;
    d = c; c = b; b = a; a = t1 + t2;
  }
  H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  
  for (int i = 0; i < 8; i++) {
    out[i*4] = (H[i] >> 24) & 0xff;
    out[i*4+1] = (H[i] >> 16) & 0xff;
    out[i*4+2] = (H[i] >> 8) & 0xff;
    out[i*4+3] = H[i] & 0xff;
  }
}
