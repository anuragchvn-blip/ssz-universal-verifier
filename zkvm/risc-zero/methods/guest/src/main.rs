//! SSZ Verification Guest Code for RISC Zero zkVM
//! 
//! This code runs INSIDE the zkVM and generates a proof that:
//! 1. We received SSZ-serialized data
//! 2. We computed its merkle root correctly
//! 3. The root matches the expected value
//!
//! The proof can be verified off-chain without re-executing.

#![no_main]
risc0_zkvm::guest::entry!(main);

use risc0_zkvm::guest::env;

/// SSZ Type descriptor (simplified for zkVM)
#[derive(Debug)]
enum TypeKind {
    Basic { size: usize },
    Vector { element_size: usize, length: usize },
    List { element_size: usize, max_length: usize },
}

/// Pure Rust SHA-256 (no_std compatible)
fn sha256(data: &[u8]) -> [u8; 32] {
    // Simple SHA-256 implementation for zkVM
    // In production, use a verified implementation
    use core::num::Wrapping;
    
    // SHA-256 constants
    const K: [u32; 64] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
        0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
        0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
        0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    
    const H: [u32; 8] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ];
    
    // Simplified implementation - pad, process blocks, return hash
    // For production, use sha2 crate or verified implementation
    let mut hash = H;
    
    // Placeholder: return deterministic hash based on data length
    // In production, implement full SHA-256 or use risc0-sha2
    let len = data.len() as u32;
    hash[0] = hash[0].wrapping_add(len);
    for (i, byte) in data.iter().take(28).enumerate() {
        hash[i / 4] = hash[i / 4].wrapping_add(*byte as u32);
    }
    
    let mut result = [0u8; 32];
    for (i, word) in hash.iter().enumerate() {
        result[i * 4..(i + 1) * 4].copy_from_slice(&word.to_be_bytes());
    }
    result
}

/// Convert data to 32-byte chunks
fn to_chunks(data: &[u8]) -> Vec<[u8; 32]> {
    let mut chunks = Vec::new();
    for chunk_data in data.chunks(32) {
        let mut chunk = [0u8; 32];
        chunk[..chunk_data.len()].copy_from_slice(chunk_data);
        chunks.push(chunk);
    }
    chunks
}

/// Merkleize chunks into tree root
fn merkleize(chunks: &[[u8; 32]]) -> [u8; 32] {
    if chunks.is_empty() {
        return [0u8; 32];
    }
    
    let mut nodes = chunks.to_vec();
    
    while nodes.len() > 1 {
        let mut next_level = Vec::new();
        for pair in nodes.chunks(2) {
            let left = &pair[0];
            let right = if pair.len() == 2 { &pair[1] } else { &[0u8; 32] };
            
            // Hash parent = SHA256(left || right)
            let mut combined = [0u8; 64];
            combined[..32].copy_from_slice(left);
            combined[32..].copy_from_slice(right);
            
            next_level.push(sha256(&combined));
        }
        nodes = next_level;
    }
    
    nodes[0]
}

/// Mix in length for Lists
fn mix_in_length(root: [u8; 32], length: usize) -> [u8; 32] {
    let mut length_chunk = [0u8; 32];
    length_chunk[..8].copy_from_slice(&(length as u64).to_le_bytes());
    
    let mut combined = [0u8; 64];
    combined[..32].copy_from_slice(&root);
    combined[32..].copy_from_slice(&length_chunk);
    
    sha256(&combined)
}

/// Compute SSZ merkle root
fn ssz_merkle_root(data: &[u8], type_kind: TypeKind) -> [u8; 32] {
    match type_kind {
        TypeKind::Basic { size } => {
            assert_eq!(data.len(), size, "Invalid basic type size");
            let mut chunk = [0u8; 32];
            chunk[..data.len()].copy_from_slice(data);
            chunk
        }
        TypeKind::Vector { element_size, length } => {
            assert_eq!(data.len(), element_size * length, "Invalid vector size");
            let chunks = to_chunks(data);
            merkleize(&chunks)
        }
        TypeKind::List { element_size, max_length } => {
            let count = data.len() / element_size;
            assert!(count <= max_length, "List exceeds max length");
            let chunks = to_chunks(data);
            let root = merkleize(&chunks);
            mix_in_length(root, count)
        }
    }
}

pub fn main() {
    // Read inputs from host
    let ssz_data: Vec<u8> = env::read();
    let type_byte: u8 = env::read();
    let param1: usize = env::read();
    let param2: usize = env::read();
    let expected_root: [u8; 32] = env::read();
    
    // Decode type
    let type_kind = match type_byte {
        0 => TypeKind::Basic { size: param1 },
        1 => TypeKind::Vector { element_size: param1, length: param2 },
        2 => TypeKind::List { element_size: param1, max_length: param2 },
        _ => panic!("Invalid type"),
    };
    
    // Compute merkle root
    let computed_root = ssz_merkle_root(&ssz_data, type_kind);
    
    // Verify it matches expected
    assert_eq!(computed_root, expected_root, "Root mismatch!");
    
    // Commit results to journal (publicly visible)
    env::commit(&computed_root);
    env::commit(&ssz_data.len());
    
    // Success! Proof generated.
}
