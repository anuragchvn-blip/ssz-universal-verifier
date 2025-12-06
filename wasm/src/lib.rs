//! WebAssembly bindings for SSZ Universal Verifier
//! 
//! This module provides JavaScript-friendly bindings for the SSZ streaming verifier.

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

pub mod hash_simd;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Type descriptor for SSZ types
#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TypeDescriptor {
    #[wasm_bindgen(skip)]
    #[serde(rename = "type", alias = "type_name")]
    pub type_name: String,
    #[wasm_bindgen(skip)]
    #[serde(rename = "elementType", alias = "element_type")]
    pub element_type: Option<Box<TypeDescriptor>>,
    #[wasm_bindgen(skip)]
    pub length: Option<usize>,
    #[wasm_bindgen(skip)]
    pub fields: Option<Vec<TypeDescriptor>>,
}

#[wasm_bindgen]
impl TypeDescriptor {
    #[wasm_bindgen(constructor)]
    pub fn new(json: &str) -> Result<TypeDescriptor, JsValue> {
        serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("Invalid type descriptor: {}", e)))
    }
    
    /// Create a basic type descriptor
    #[wasm_bindgen(js_name = createBasic)]
    pub fn create_basic(type_name: &str) -> TypeDescriptor {
        TypeDescriptor {
            type_name: type_name.to_string(),
            element_type: None,
            length: None,
            fields: None,
        }
    }
    
    /// Create a container type descriptor
    #[wasm_bindgen(js_name = createContainer)]
    pub fn create_container(fields_json: &str) -> Result<TypeDescriptor, JsValue> {
        let fields: Vec<TypeDescriptor> = serde_json::from_str(fields_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid fields: {}", e)))?;
        
        Ok(TypeDescriptor {
            type_name: "container".to_string(),
            element_type: None,
            length: None,
            fields: Some(fields),
        })
    }
}

/// Compute SSZ merkle root from serialized bytes
#[wasm_bindgen(js_name = sszStreamRoot)]
pub fn ssz_stream_root(data: &[u8], type_desc_json: &str) -> Result<Vec<u8>, JsValue> {
    let type_desc: TypeDescriptor = serde_json::from_str(type_desc_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid type descriptor: {}", e)))?;
    
    compute_root(data, &type_desc)
        .map_err(|e| JsValue::from_str(&e))
}

/// Compute root from chunks
#[wasm_bindgen(js_name = computeRootFromChunks)]
pub fn compute_root_from_chunks(chunks: &[u8]) -> Result<Vec<u8>, JsValue> {
    if chunks.len() % 32 != 0 {
        return Err(JsValue::from_str("Chunks must be 32-byte aligned"));
    }
    
    let mut nodes: Vec<[u8; 32]> = chunks
        .chunks_exact(32)
        .map(|chunk| {
            let mut arr = [0u8; 32];
            arr.copy_from_slice(chunk);
            arr
        })
        .collect();
    
    // Merkleize
    while nodes.len() > 1 {
        let mut next_level = Vec::new();
        for pair in nodes.chunks(2) {
            let left = &pair[0];
            let right = if pair.len() == 2 {
                &pair[1]
            } else {
                &[0u8; 32]
            };
            
            let mut hasher = Sha256::new();
            hasher.update(left);
            hasher.update(right);
            let hash = hasher.finalize();
            
            let mut node = [0u8; 32];
            node.copy_from_slice(&hash);
            next_level.push(node);
        }
        nodes = next_level;
    }
    
    Ok(nodes[0].to_vec())
}

/// Validate bitlist padding
#[wasm_bindgen(js_name = validateBitlist)]
pub fn validate_bitlist(data: &[u8]) -> Result<bool, JsValue> {
    if data.is_empty() {
        return Err(JsValue::from_str("Bitlist cannot be empty"));
    }
    
    let last_byte = data[data.len() - 1];
    if last_byte == 0 {
        return Err(JsValue::from_str("Invalid bitlist: last byte is zero"));
    }
    
    // Find the highest set bit (delimiter)
    let delimiter_bit = 7 - last_byte.leading_zeros() as usize;
    
    Ok(delimiter_bit < 8)
}

/// Get version information
#[wasm_bindgen(js_name = getVersion)]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// Internal helper functions

fn compute_root(data: &[u8], type_desc: &TypeDescriptor) -> Result<Vec<u8>, String> {
    match type_desc.type_name.as_str() {
        "uint64" | "uint32" | "uint16" | "uint8" => {
            if data.len() != get_basic_size(&type_desc.type_name) {
                return Err(format!("Invalid {} size", type_desc.type_name));
            }
            let mut chunk = [0u8; 32];
            chunk[..data.len()].copy_from_slice(data);
            Ok(chunk.to_vec())
        }
        "bytes32" => {
            if data.len() != 32 {
                return Err("Invalid bytes32 size".to_string());
            }
            Ok(data.to_vec())
        }
        "bitlist" => {
            if data.is_empty() {
                return Err("Bitlist cannot be empty".to_string());
            }
            validate_bitlist_internal(data)?;
            
            // Remove delimiter bit and compute chunks
            let mut data_copy = data.to_vec();
            let last_byte = data_copy.last_mut()
                .ok_or("Bitlist data unexpectedly empty after validation")?;
            let delimiter_bit = 7 - last_byte.leading_zeros() as usize;
            *last_byte &= (1 << delimiter_bit) - 1;
            
            let chunks = to_chunks(&data_copy);
            merkleize_with_length(&chunks, data.len() * 8 - 1)
        }
        "list" => {
            let elem_type = type_desc.element_type.as_ref()
                .ok_or("List missing element_type")?;
            let max_length = type_desc.length
                .ok_or("List missing length")?;
            
            let elem_size = get_basic_size(&elem_type.type_name);
            if data.len() % elem_size != 0 {
                return Err("Invalid list data size".to_string());
            }
            
            let count = data.len() / elem_size;
            if count > max_length {
                return Err("List exceeds max length".to_string());
            }
            
            let chunks = to_chunks(data);
            merkleize_with_length(&chunks, count)
        }
        "vector" => {
            let elem_type = type_desc.element_type.as_ref()
                .ok_or("Vector missing element_type")?;
            let expected_len = type_desc.length
                .ok_or("Vector missing length")?;
            
            let elem_size = get_basic_size(&elem_type.type_name);
            if data.len() != expected_len * elem_size {
                return Err("Invalid vector size".to_string());
            }
            
            let chunks = to_chunks(data);
            merkleize(&chunks)
        }
        "container" => {
            let fields = type_desc.fields.as_ref()
                .ok_or("Container missing fields")?;
            
            let mut offset = 0;
            let mut field_roots = Vec::new();
            
            for field in fields {
                let field_size = get_basic_size(&field.type_name);
                if offset + field_size > data.len() {
                    return Err("Container data too short".to_string());
                }
                
                let field_data = &data[offset..offset + field_size];
                let field_root = compute_root(field_data, field)?;
                field_roots.extend_from_slice(&field_root[..32]);
                offset += field_size;
            }
            
            let chunks: Vec<[u8; 32]> = field_roots
                .chunks_exact(32)
                .map(|chunk| {
                    let mut arr = [0u8; 32];
                    arr.copy_from_slice(chunk);
                    arr
                })
                .collect();
            
            merkleize(&chunks)
        }
        _ => Err(format!("Unknown type: {}", type_desc.type_name))
    }
}

fn get_basic_size(type_name: &str) -> usize {
    match type_name {
        "uint8" => 1,
        "uint16" => 2,
        "uint32" => 4,
        "uint64" => 8,
        "bytes32" => 32,
        _ => 0,
    }
}

fn validate_bitlist_internal(data: &[u8]) -> Result<(), String> {
    let last_byte = data[data.len() - 1];
    if last_byte == 0 {
        return Err("Invalid bitlist: last byte is zero".to_string());
    }
    Ok(())
}

fn to_chunks(data: &[u8]) -> Vec<[u8; 32]> {
    let mut chunks = Vec::new();
    for chunk_data in data.chunks(32) {
        let mut chunk = [0u8; 32];
        chunk[..chunk_data.len()].copy_from_slice(chunk_data);
        chunks.push(chunk);
    }
    chunks
}

fn merkleize(chunks: &[[u8; 32]]) -> Result<Vec<u8>, String> {
    if chunks.is_empty() {
        return Ok(vec![0u8; 32]);
    }
    
    let mut nodes = chunks.to_vec();
    
    while nodes.len() > 1 {
        let mut next_level = Vec::new();
        for pair in nodes.chunks(2) {
            let left = &pair[0];
            let right = if pair.len() == 2 {
                &pair[1]
            } else {
                &[0u8; 32]
            };
            
            let mut hasher = Sha256::new();
            hasher.update(left);
            hasher.update(right);
            let hash = hasher.finalize();
            
            let mut node = [0u8; 32];
            node.copy_from_slice(&hash);
            next_level.push(node);
        }
        nodes = next_level;
    }
    
    Ok(nodes[0].to_vec())
}

fn merkleize_with_length(chunks: &[[u8; 32]], length: usize) -> Result<Vec<u8>, String> {
    let root = merkleize(chunks)?;
    
    // Mix in length
    let mut length_chunk = [0u8; 32];
    length_chunk[..8].copy_from_slice(&(length as u64).to_le_bytes());
    
    let mut hasher = Sha256::new();
    hasher.update(&root);
    hasher.update(&length_chunk);
    let final_root = hasher.finalize();
    
    Ok(final_root.to_vec())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_uint64_root() {
        let data = vec![42u8, 0, 0, 0, 0, 0, 0, 0];
        let type_desc = TypeDescriptor::create_basic("uint64");
        let type_json = serde_json::to_string(&type_desc).unwrap();
        
        let root = ssz_stream_root(&data, &type_json).unwrap();
        assert_eq!(root.len(), 32);
    }
    
    #[test]
    fn test_validate_bitlist() {
        // Valid bitlist with delimiter
        let valid = vec![0b00000001u8];
        assert!(validate_bitlist(&valid).is_ok());
        
        // Invalid: last byte is zero
        let invalid = vec![0b00000000u8];
        assert!(validate_bitlist(&invalid).is_err());
    }
}
