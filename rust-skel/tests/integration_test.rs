use ssz_stream::{ssz_stream_root_from_slice, TypeDesc, TypeKind, SszError};

fn hex_to_bytes(hex: &str) -> Vec<u8> {
    let hex = hex.trim_start_matches("0x");
    (0..hex.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&hex[i..i + 2], 16).unwrap())
        .collect()
}

#[allow(dead_code)]
fn bytes_to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

#[test]
fn test_uint64_zero() {
    let td = TypeDesc {
        kind: TypeKind::Basic,
        fixed_size: Some(8),
    };
    let data = [0u8; 8];
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_ok());
}

#[test]
fn test_uint64_nonzero() {
    let td = TypeDesc {
        kind: TypeKind::Basic,
        fixed_size: Some(8),
    };
    let mut data = [0u8; 8];
    data[0] = 0xff;
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_ok());
}

#[test]
fn test_bytes32() {
    let td = TypeDesc {
        kind: TypeKind::Basic,
        fixed_size: Some(32),
    };
    let mut data = [0u8; 32];
    data[0] = 0xaa;
    data[31] = 0xbb;
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_ok());
}

#[test]
fn test_bitlist_valid() {
    let td = TypeDesc {
        kind: TypeKind::Bitlist,
        fixed_size: None,
    };
    // 4 bits with sentinel: 0x10 = 0b00010000
    let data = hex_to_bytes("10");
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_ok());
}

#[test]
fn test_bitlist_5_bits() {
    let td = TypeDesc {
        kind: TypeKind::Bitlist,
        fixed_size: None,
    };
    let data = hex_to_bytes("20"); // 5 bits
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_ok());
}

#[test]
fn test_bitlist_6_bits() {
    let td = TypeDesc {
        kind: TypeKind::Bitlist,
        fixed_size: None,
    };
    let data = hex_to_bytes("40"); // 6 bits
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_ok());
}

#[test]
fn test_bitlist_7_bits() {
    let td = TypeDesc {
        kind: TypeKind::Bitlist,
        fixed_size: None,
    };
    let data = hex_to_bytes("80"); // 7 bits
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_ok());
}

#[test]
fn test_bitlist_empty_fails() {
    let td = TypeDesc {
        kind: TypeKind::Bitlist,
        fixed_size: None,
    };
    let data: Vec<u8> = vec![];
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), SszError::NonCanonical);
}

#[test]
fn test_bitlist_zero_sentinel_fails() {
    let td = TypeDesc {
        kind: TypeKind::Bitlist,
        fixed_size: None,
    };
    let data = hex_to_bytes("00");
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), SszError::BitlistPadding);
}

#[test]
fn test_bitlist_invalid_padding() {
    let td = TypeDesc {
        kind: TypeKind::Bitlist,
        fixed_size: None,
    };
    // 0x3F has non-zero padding for certain interpretations
    let data = hex_to_bytes("3f");
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), SszError::BitlistPadding);
}

#[test]
fn test_list_uint64_empty() {
    let td = TypeDesc {
        kind: TypeKind::List,
        fixed_size: Some(8), // element size
    };
    let data: Vec<u8> = vec![];
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_ok());
}

#[test]
fn test_list_uint64_single() {
    let td = TypeDesc {
        kind: TypeKind::List,
        fixed_size: Some(8),
    };
    let data = [1u8, 0, 0, 0, 0, 0, 0, 0];
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_ok());
}

#[test]
fn test_list_uint64_multiple() {
    let td = TypeDesc {
        kind: TypeKind::List,
        fixed_size: Some(8),
    };
    let mut data = vec![0u8; 24]; // 3 uint64s
    data[0] = 1;
    data[8] = 2;
    data[16] = 3;
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_ok());
}

#[test]
fn test_uint64_wrong_size_fails() {
    let td = TypeDesc {
        kind: TypeKind::Basic,
        fixed_size: Some(8),
    };
    let data = [0u8; 9]; // Wrong size
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), SszError::NonCanonical);
}

#[test]
fn test_list_misaligned_fails() {
    let td = TypeDesc {
        kind: TypeKind::List,
        fixed_size: Some(8),
    };
    let data = [0u8; 9]; // Not multiple of 8
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), SszError::NonCanonical);
}

#[test]
fn test_container_fixed_size() {
    let td = TypeDesc {
        kind: TypeKind::Container,
        fixed_size: Some(16), // 2 uint64 fields
    };
    let data = [0u8; 16];
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_ok());
}

#[test]
fn test_large_list() {
    let td = TypeDesc {
        kind: TypeKind::List,
        fixed_size: Some(8),
    };
    let mut data = vec![0u8; 800]; // 100 uint64s
    for i in 0..100 {
        data[i * 8] = (i & 0xff) as u8;
    }
    let result = ssz_stream_root_from_slice(&td, &data);
    assert!(result.is_ok());
}
