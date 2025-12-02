#![no_std]

extern crate alloc;
use alloc::vec::Vec;

pub mod hash;

use hash::hash_parent;

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum TypeKind {
    Basic,
    Vector,
    List,
    Container,
    Bitlist,
}

#[derive(Clone, Copy)]
pub struct TypeDesc {
    pub kind: TypeKind,
    pub fixed_size: Option<usize>,
    // Simplified: no recursive types in this no_std skeleton
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SszError {
    None,
    BadOffset,
    NonCanonical,
    BitlistPadding,
    UnsupportedType,
    MalformedHeader,
    LengthOverflow,
    UnexpectedEOF,
}

#[derive(Clone, Copy)]
struct Range {
    start: usize,
    end: usize,
}

#[derive(Clone, Copy)]
struct StackEntry {
    hash: [u8; 32],
    height: u32,
}

const MAX_STACK_DEPTH: usize = 32;

fn push_and_merge(stack: &mut [StackEntry; MAX_STACK_DEPTH], depth: &mut usize, entry: StackEntry) {
    stack[*depth] = entry;
    *depth += 1;
    while *depth >= 2 {
        let top = stack[*depth - 1];
        let below = stack[*depth - 2];
        if below.height != top.height { break; }
        
        let parent = hash_parent(&below.hash, &top.hash);
        *depth -= 2;
        stack[*depth] = StackEntry { hash: parent, height: below.height + 1 };
        *depth += 1;
    }
}

fn mixin_length(root: &mut [u8; 32], length: usize) {
    let mut len_buf = [0u8; 32];
    len_buf[0] = (length & 0xff) as u8;
    len_buf[1] = ((length >> 8) & 0xff) as u8;
    len_buf[2] = ((length >> 16) & 0xff) as u8;
    len_buf[3] = ((length >> 24) & 0xff) as u8;
    let new_root = hash_parent(root, &len_buf);
    *root = new_root;
}

#[allow(dead_code)]
fn read_u32_le(bytes: &[u8], offset: usize) -> u32 {
    (bytes[offset] as u32)
        | ((bytes[offset + 1] as u32) << 8)
        | ((bytes[offset + 2] as u32) << 16)
        | ((bytes[offset + 3] as u32) << 24)
}

fn parse_to_ranges(td: &TypeDesc, bytes: &[u8]) -> Result<Vec<Range>, SszError> {
    match td.kind {
        TypeKind::Basic => {
            let fixed_size = td.fixed_size.ok_or(SszError::UnsupportedType)?;
            if fixed_size == 0 {
                // Variable-length bytes
                return Ok(Vec::from([Range { start: 0, end: bytes.len() }]));
            }
            if bytes.len() != fixed_size {
                return Err(SszError::NonCanonical);
            }
            Ok(Vec::from([Range { start: 0, end: bytes.len() }]))
        }
        TypeKind::Bitlist => {
            if bytes.is_empty() {
                return Err(SszError::NonCanonical);
            }
            let last_byte = bytes[bytes.len() - 1];
            if last_byte == 0 {
                return Err(SszError::BitlistPadding);
            }
            
            // Find sentinel bit position
            let mut bit_len = (bytes.len() - 1) * 8;
            let mut sentinel = last_byte;
            while sentinel > 1 {
                bit_len += 1;
                sentinel >>= 1;
            }
            
            // Check padding bits are zero
            let padding_bits = (bytes.len() * 8) - bit_len - 1;
            if padding_bits < 32 {
                let mask = (1u32 << padding_bits) - 1;
                if (last_byte as u32 & mask) != 0 {
                    return Err(SszError::BitlistPadding);
                }
            }
            
            Ok(Vec::from([Range { start: 0, end: bytes.len() }]))
        }
        TypeKind::List | TypeKind::Vector => {
            // Simplified: only handle fixed-size elements for now
            if let Some(elem_size) = td.fixed_size {
                if elem_size > 0 {
                    if bytes.len() % elem_size != 0 {
                        return Err(SszError::NonCanonical);
                    }
                    let count = bytes.len() / elem_size;
                    let mut ranges = Vec::new();
                    for i in 0..count {
                        ranges.push(Range {
                            start: i * elem_size,
                            end: (i + 1) * elem_size,
                        });
                    }
                    return Ok(ranges);
                }
            }
            // Variable-size elements not fully implemented
            Err(SszError::UnsupportedType)
        }
        TypeKind::Container => {
            // Simplified: only handle all-fixed-size containers
            if let Some(total_size) = td.fixed_size {
                if bytes.len() != total_size {
                    return Err(SszError::MalformedHeader);
                }
                Ok(Vec::from([Range { start: 0, end: bytes.len() }]))
            } else {
                Err(SszError::UnsupportedType)
            }
        }
    }
}

fn stream_chunks<'a>(bytes: &'a [u8], ranges: &'a [Range]) -> impl Iterator<Item = [u8; 32]> + 'a {
    ranges.iter().flat_map(move |range| {
        let range_bytes = &bytes[range.start..range.end];
        let mut offset = 0;
        core::iter::from_fn(move || {
            if offset >= range_bytes.len() {
                return None;
            }
            let mut chunk = [0u8; 32];
            let remain = range_bytes.len() - offset;
            let copy_len = if remain < 32 { remain } else { 32 };
            chunk[..copy_len].copy_from_slice(&range_bytes[offset..offset + copy_len]);
            offset += 32;
            Some(chunk)
        })
    })
}

fn compute_root_from_chunks<I>(chunks: I, mixin_len: Option<usize>) -> [u8; 32]
where
    I: Iterator<Item = [u8; 32]>,
{
    let mut stack = [StackEntry { hash: [0; 32], height: 0 }; MAX_STACK_DEPTH];
    let mut depth = 0;

    for chunk in chunks {
        push_and_merge(&mut stack, &mut depth, StackEntry { hash: chunk, height: 0 });
    }

    if depth == 0 {
        let mut root = [0u8; 32];
        if let Some(len) = mixin_len {
            mixin_length(&mut root, len);
        }
        return root;
    }

    while depth > 1 {
        let top = stack[depth - 1];
        let below = stack[depth - 2];
        let parent = hash_parent(&below.hash, &top.hash);
        depth -= 2;
        stack[depth] = StackEntry {
            hash: parent,
            height: below.height + 1,
        };
        depth += 1;
    }

    let mut root = stack[0].hash;
    if let Some(len) = mixin_len {
        mixin_length(&mut root, len);
    }
    root
}

pub fn ssz_stream_root_from_slice(td: &TypeDesc, bytes: &[u8]) -> Result<[u8; 32], SszError> {
    let ranges = parse_to_ranges(td, bytes)?;
    
    let mixin_len = match td.kind {
        TypeKind::List => Some(ranges.len()),
        TypeKind::Bitlist if !bytes.is_empty() => {
            let last_byte = bytes[bytes.len() - 1];
            let mut bit_len = (bytes.len() - 1) * 8;
            let mut sentinel = last_byte;
            while sentinel > 1 {
                bit_len += 1;
                sentinel >>= 1;
            }
            Some(bit_len)
        }
        _ => None,
    };
    
    let chunks = stream_chunks(bytes, &ranges);
    Ok(compute_root_from_chunks(chunks, mixin_len))
}
