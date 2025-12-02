#![no_std]

pub mod hash;

use hash::{sha256, hash_parent};

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

#[derive(Debug)]
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
    // higher bytes 0
    let new_root = hash_parent(root, &len_buf);
    *root = new_root;
}

pub fn ssz_stream_root_from_slice(
    td: &TypeDesc,
    bytes: &[u8],
) -> Result<[u8; 32], SszError> {
    if let TypeKind::Basic = td.kind {
        if let Some(fixed) = td.fixed_size {
            if bytes.len() != fixed { return Err(SszError::NonCanonical); }
            let mut chunk = [0u8; 32];
            let copy_len = if bytes.len() < 32 { bytes.len() } else { 32 };
            chunk[..copy_len].copy_from_slice(&bytes[..copy_len]);
            return Ok(chunk);
        }
    }

    let mut stack = [StackEntry { hash: [0; 32], height: 0 }; MAX_STACK_DEPTH];
    let mut depth = 0;
    let mut offset = 0;
    let mut chunk_count = 0;

    while offset < bytes.len() {
        let mut chunk = [0u8; 32];
        let remain = bytes.len() - offset;
        let copy = if remain < 32 { remain } else { 32 };
        chunk[..copy].copy_from_slice(&bytes[offset..offset+copy]);
        
        push_and_merge(&mut stack, &mut depth, StackEntry { hash: chunk, height: 0 });
        
        offset += 32;
        chunk_count += 1;
    }

    if depth == 0 {
        let mut root = [0u8; 32];
        if let TypeKind::List = td.kind {
            mixin_length(&mut root, 0);
        }
        return Ok(root);
    }

    while depth > 1 {
        let top = stack[depth - 1];
        let below = stack[depth - 2];
        let parent = hash_parent(&below.hash, &top.hash);
        depth -= 2;
        stack[depth] = StackEntry { hash: parent, height: below.height + 1 };
        depth += 1;
    }

    let mut root = stack[0].hash;
    if let TypeKind::List = td.kind {
        // Assuming packed bytes for now
        mixin_length(&mut root, chunk_count);
    }

    Ok(root)
}
