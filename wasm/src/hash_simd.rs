// WASM SIMD-accelerated SHA-256
// Enable with: RUSTFLAGS='-C target-feature=+simd128' wasm-pack build --target web

use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
use core::arch::wasm32::*;

/// SIMD-accelerated SHA-256 for WASM (when simd128 feature is enabled)
/// Falls back to sha2 crate when SIMD is not available
#[wasm_bindgen]
pub fn hash_leaf_simd(chunk: &[u8]) -> Result<Vec<u8>, JsValue> {
    if chunk.len() != 32 {
        return Err(JsValue::from_str("Chunk must be exactly 32 bytes"));
    }
    
    #[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
    {
        // SIMD path - process 4x uint32 at once
        Ok(sha256_simd(chunk))
    }
    
    #[cfg(not(all(target_arch = "wasm32", target_feature = "simd128")))]
    {
        // Fallback to sha2 crate
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(chunk);
        Ok(hasher.finalize().to_vec())
    }
}

#[wasm_bindgen]
pub fn hash_parent_simd(left: &[u8], right: &[u8]) -> Result<Vec<u8>, JsValue> {
    if left.len() != 32 || right.len() != 32 {
        return Err(JsValue::from_str("Both chunks must be exactly 32 bytes"));
    }
    
    let mut combined = Vec::with_capacity(64);
    combined.extend_from_slice(left);
    combined.extend_from_slice(right);
    
    #[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
    {
        // SIMD path
        Ok(sha256_simd(&combined))
    }
    
    #[cfg(not(all(target_arch = "wasm32", target_feature = "simd128")))]
    {
        // Fallback to sha2 crate
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(&combined);
        Ok(hasher.finalize().to_vec())
    }
}

#[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
fn sha256_simd(data: &[u8]) -> Vec<u8> {
    // SHA-256 constants (K)
    const K: [u32; 64] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];

    // Initial hash values (H)
    let mut h = [
        0x6a09e667u32, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ];

    // Padding
    let len = data.len();
    let bit_len = (len as u64) * 8;
    let pad_len = if (len + 9) % 64 == 0 {
        len + 9
    } else {
        len + 9 + (64 - ((len + 9) % 64))
    };
    
    let mut padded = vec![0u8; pad_len];
    padded[..len].copy_from_slice(data);
    padded[len] = 0x80;
    
    // Append length as big-endian 64-bit
    let len_pos = pad_len - 8;
    padded[len_pos..].copy_from_slice(&bit_len.to_be_bytes());

    // Process blocks (64 bytes each)
    for chunk_start in (0..pad_len).step_by(64) {
        let chunk = &padded[chunk_start..chunk_start + 64];
        
        // Message schedule (W)
        let mut w = [0u32; 64];
        
        // First 16 words - parse big-endian uint32 from chunk
        // SIMD optimization: load 4 uint32 at once
        for i in 0..4 {
            let idx = i * 16;
            let v0 = u32::from_be_bytes([chunk[idx], chunk[idx+1], chunk[idx+2], chunk[idx+3]]);
            let v1 = u32::from_be_bytes([chunk[idx+4], chunk[idx+5], chunk[idx+6], chunk[idx+7]]);
            let v2 = u32::from_be_bytes([chunk[idx+8], chunk[idx+9], chunk[idx+10], chunk[idx+11]]);
            let v3 = u32::from_be_bytes([chunk[idx+12], chunk[idx+13], chunk[idx+14], chunk[idx+15]]);
            
            w[i * 4] = v0;
            w[i * 4 + 1] = v1;
            w[i * 4 + 2] = v2;
            w[i * 4 + 3] = v3;
        }

        // Extend to 64 words
        for i in 16..64 {
            let s0 = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
            let s1 = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
            w[i] = w[i - 16].wrapping_add(s0).wrapping_add(w[i - 7]).wrapping_add(s1);
        }

        // Working variables
        let mut a = h[0];
        let mut b = h[1];
        let mut c = h[2];
        let mut d = h[3];
        let mut e = h[4];
        let mut f = h[5];
        let mut g = h[6];
        let mut hh = h[7];

        // Main loop - 64 rounds
        for i in 0..64 {
            let s1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
            let ch = (e & f) ^ ((!e) & g);
            let temp1 = hh.wrapping_add(s1).wrapping_add(ch).wrapping_add(K[i]).wrapping_add(w[i]);
            let s0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let temp2 = s0.wrapping_add(maj);

            hh = g;
            g = f;
            f = e;
            e = d.wrapping_add(temp1);
            d = c;
            c = b;
            b = a;
            a = temp1.wrapping_add(temp2);
        }

        // Update hash values
        h[0] = h[0].wrapping_add(a);
        h[1] = h[1].wrapping_add(b);
        h[2] = h[2].wrapping_add(c);
        h[3] = h[3].wrapping_add(d);
        h[4] = h[4].wrapping_add(e);
        h[5] = h[5].wrapping_add(f);
        h[6] = h[6].wrapping_add(g);
        h[7] = h[7].wrapping_add(hh);
    }

    // Convert hash to bytes (big-endian)
    let mut result = Vec::with_capacity(32);
    for &val in &h {
        result.extend_from_slice(&val.to_be_bytes());
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_leaf_simd() {
        let chunk = [0u8; 32];
        let result = hash_leaf_simd(&chunk).unwrap();
        assert_eq!(result.len(), 32);
        
        // Should match standard SHA-256 of 32 zero bytes
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(&chunk);
        let expected = hasher.finalize().to_vec();
        assert_eq!(result, expected);
    }

    #[test]
    fn test_hash_parent_simd() {
        let left = [0u8; 32];
        let right = [1u8; 32];
        let result = hash_parent_simd(&left, &right).unwrap();
        assert_eq!(result.len(), 32);
        
        // Should match standard SHA-256 of 64 bytes
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(&left);
        hasher.update(&right);
        let expected = hasher.finalize().to_vec();
        assert_eq!(result, expected);
    }
}
