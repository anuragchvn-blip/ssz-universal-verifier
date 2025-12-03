#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include "../include/ssz_stream.h"

/* Test framework */
static int tests_run = 0;
static int tests_passed = 0;

#define TEST(name) static void test_##name(void)
#define RUN_TEST(name) do { \
    printf("Running %s...", #name); \
    test_##name(); \
    tests_run++; \
    tests_passed++; \
    printf(" PASSED\n"); \
} while(0)

#define ASSERT_EQ(actual, expected) do { \
    if ((actual) != (expected)) { \
        printf("\n  FAILED: %s:%d: Expected %d, got %d\n", __FILE__, __LINE__, (int)(expected), (int)(actual)); \
        exit(1); \
    } \
} while(0)

#define ASSERT_BYTES_EQ(actual, expected, len) do { \
    if (memcmp((actual), (expected), (len)) != 0) { \
        printf("\n  FAILED: %s:%d: Byte mismatch\n", __FILE__, __LINE__); \
        printf("  Expected: "); for(size_t i=0; i<(len); i++) printf("%02x", ((uint8_t*)(expected))[i]); \
        printf("\n  Actual:   "); for(size_t i=0; i<(len); i++) printf("%02x", ((uint8_t*)(actual))[i]); \
        printf("\n"); \
        exit(1); \
    } \
} while(0)

/* ===== BASIC TYPES TESTS ===== */

TEST(uint8_zero) {
    uint8_t data[] = {0x00};
    uint8_t expected[32] = {0};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 1, &td, root, err);
    ASSERT_EQ(ret, 0);
    ASSERT_BYTES_EQ(root, expected, 32);
}

TEST(uint8_max) {
    uint8_t data[] = {0xFF};
    uint8_t expected[32] = {0xFF, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 1, &td, root, err);
    ASSERT_EQ(ret, 0);
    ASSERT_BYTES_EQ(root, expected, 32);
}

TEST(uint16_zero) {
    uint8_t data[] = {0x00, 0x00};
    uint8_t expected[32] = {0};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc td = {SSZ_KIND_BASIC, 2, NULL, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 2, &td, root, err);
    ASSERT_EQ(ret, 0);
    ASSERT_BYTES_EQ(root, expected, 32);
}

TEST(uint16_max) {
    uint8_t data[] = {0xFF, 0xFF};
    uint8_t expected[32] = {0xFF, 0xFF, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc td = {SSZ_KIND_BASIC, 2, NULL, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 2, &td, root, err);
    ASSERT_EQ(ret, 0);
    ASSERT_BYTES_EQ(root, expected, 32);
}

TEST(uint32_zero) {
    uint8_t data[] = {0x00, 0x00, 0x00, 0x00};
    uint8_t expected[32] = {0};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc td = {SSZ_KIND_BASIC, 4, NULL, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 4, &td, root, err);
    ASSERT_EQ(ret, 0);
    ASSERT_BYTES_EQ(root, expected, 32);
}

TEST(uint32_max) {
    uint8_t data[] = {0xFF, 0xFF, 0xFF, 0xFF};
    uint8_t expected[32] = {0xFF, 0xFF, 0xFF, 0xFF, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc td = {SSZ_KIND_BASIC, 4, NULL, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 4, &td, root, err);
    ASSERT_EQ(ret, 0);
    ASSERT_BYTES_EQ(root, expected, 32);
}

TEST(uint64_zero) {
    uint8_t data[] = {0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
    uint8_t expected[32] = {0};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc td = {SSZ_KIND_BASIC, 8, NULL, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 8, &td, root, err);
    ASSERT_EQ(ret, 0);
    ASSERT_BYTES_EQ(root, expected, 32);
}

TEST(uint64_max) {
    uint8_t data[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
    uint8_t expected[32] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                            0, 0, 0, 0, 0, 0, 0, 0};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc td = {SSZ_KIND_BASIC, 8, NULL, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 8, &td, root, err);
    ASSERT_EQ(ret, 0);
    ASSERT_BYTES_EQ(root, expected, 32);
}

TEST(uint256_zero) {
    uint8_t data[32] = {0};
    uint8_t expected[32] = {0};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc td = {SSZ_KIND_BASIC, 32, NULL, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 32, &td, root, err);
    ASSERT_EQ(ret, 0);
    ASSERT_BYTES_EQ(root, expected, 32);
}

TEST(uint256_max) {
    uint8_t data[32];
    memset(data, 0xFF, 32);
    uint8_t expected[32];
    memset(expected, 0xFF, 32);
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc td = {SSZ_KIND_BASIC, 32, NULL, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 32, &td, root, err);
    ASSERT_EQ(ret, 0);
    ASSERT_BYTES_EQ(root, expected, 32);
}

TEST(bool_false) {
    uint8_t data[] = {0x00};
    uint8_t expected[32] = {0};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 1, &td, root, err);
    ASSERT_EQ(ret, 0);
    ASSERT_BYTES_EQ(root, expected, 32);
}

TEST(bool_true) {
    uint8_t data[] = {0x01};
    uint8_t expected[32] = {0x01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 1, &td, root, err);
    ASSERT_EQ(ret, 0);
    ASSERT_BYTES_EQ(root, expected, 32);
}

/* ===== VECTOR TESTS ===== */

TEST(vector_empty) {
    uint8_t data[] = {};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_VECTOR, 0, &elem_td, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 0, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(vector_single_uint8) {
    uint8_t data[] = {0x42};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_VECTOR, 1, &elem_td, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 1, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(vector_two_uint8) {
    uint8_t data[] = {0x01, 0x02};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_VECTOR, 2, &elem_td, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 2, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(vector_32_uint8) {
    uint8_t data[32];
    for (int i = 0; i < 32; i++) data[i] = i;
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_VECTOR, 32, &elem_td, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 32, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(vector_64_uint8) {
    uint8_t data[64];
    for (int i = 0; i < 64; i++) data[i] = i;
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_VECTOR, 64, &elem_td, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 64, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(vector_128_uint8) {
    uint8_t data[128];
    for (int i = 0; i < 128; i++) data[i] = i % 256;
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_VECTOR, 128, &elem_td, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 128, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(vector_uint16_two_elements) {
    uint8_t data[] = {0x01, 0x00, 0x02, 0x00}; // [1, 2] in little-endian
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 2, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_VECTOR, 4, &elem_td, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 4, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(vector_uint32_four_elements) {
    uint8_t data[16];
    for (int i = 0; i < 4; i++) {
        data[i*4] = i+1;
        data[i*4+1] = 0;
        data[i*4+2] = 0;
        data[i*4+3] = 0;
    }
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 4, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_VECTOR, 16, &elem_td, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 16, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(vector_uint64_two_elements) {
    uint8_t data[16];
    memset(data, 0, 16);
    data[0] = 0xAA;
    data[8] = 0xBB;
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 8, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_VECTOR, 16, &elem_td, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 16, &td, root, err);
    ASSERT_EQ(ret, 0);
}

/* ===== LIST TESTS ===== */

TEST(list_empty) {
    uint8_t data[] = {};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 100};
    int ret = ssz_stream_root_from_buffer(data, 0, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(list_single_uint8) {
    uint8_t data[] = {0x42};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 100};
    int ret = ssz_stream_root_from_buffer(data, 1, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(list_two_uint8) {
    uint8_t data[] = {0x01, 0x02};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 100};
    int ret = ssz_stream_root_from_buffer(data, 2, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(list_32_uint8) {
    uint8_t data[32];
    for (int i = 0; i < 32; i++) data[i] = i;
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 100};
    int ret = ssz_stream_root_from_buffer(data, 32, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(list_64_uint8) {
    uint8_t data[64];
    for (int i = 0; i < 64; i++) data[i] = i;
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 200};
    int ret = ssz_stream_root_from_buffer(data, 64, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(list_uint16_elements) {
    uint8_t data[] = {0x01, 0x00, 0x02, 0x00, 0x03, 0x00}; // [1, 2, 3]
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 2, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 100};
    int ret = ssz_stream_root_from_buffer(data, 6, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(list_uint32_elements) {
    uint8_t data[12];
    for (int i = 0; i < 3; i++) {
        data[i*4] = i+1;
        data[i*4+1] = 0;
        data[i*4+2] = 0;
        data[i*4+3] = 0;
    }
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 4, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 100};
    int ret = ssz_stream_root_from_buffer(data, 12, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(list_uint64_elements) {
    uint8_t data[16];
    memset(data, 0, 16);
    data[0] = 0xAA;
    data[8] = 0xBB;
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 8, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 100};
    int ret = ssz_stream_root_from_buffer(data, 16, &td, root, err);
    ASSERT_EQ(ret, 0);
}

/* ===== EDGE CASES ===== */

TEST(edge_exact_chunk_boundary) {
    uint8_t data[32];
    memset(data, 0xAB, 32);
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 100};
    int ret = ssz_stream_root_from_buffer(data, 32, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(edge_just_over_chunk) {
    uint8_t data[33];
    memset(data, 0xAB, 33);
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 100};
    int ret = ssz_stream_root_from_buffer(data, 33, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(edge_multiple_chunks) {
    uint8_t data[96]; // 3 chunks
    for (int i = 0; i < 96; i++) data[i] = i % 256;
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 200};
    int ret = ssz_stream_root_from_buffer(data, 96, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(edge_large_list) {
    uint8_t data[256];
    for (int i = 0; i < 256; i++) data[i] = i;
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 500};
    int ret = ssz_stream_root_from_buffer(data, 256, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(edge_power_of_two_sizes) {
    for (int size = 1; size <= 128; size *= 2) {
        uint8_t *data = malloc(size);
        for (int i = 0; i < size; i++) data[i] = i % 256;
        uint8_t root[32];
        char err[128] = {0};
        TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
        TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 200};
        int ret = ssz_stream_root_from_buffer(data, size, &td, root, err);
        ASSERT_EQ(ret, 0);
        free(data);
    }
}

TEST(edge_max_depth_shallow) {
    uint8_t data[8];
    memset(data, 0xFF, 8);
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 16};
    int ret = ssz_stream_root_from_buffer(data, 8, &td, root, err);
    ASSERT_EQ(ret, 0);
}

/* ===== KNOWN ETHEREUM TEST VECTORS ===== */

TEST(ethereum_empty_bytes32) {
    uint8_t data[32] = {0};
    uint8_t expected[32] = {0};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc td = {SSZ_KIND_BASIC, 32, NULL, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 32, &td, root, err);
    ASSERT_EQ(ret, 0);
    ASSERT_BYTES_EQ(root, expected, 32);
}

TEST(ethereum_slot_zero) {
    uint8_t data[8] = {0};
    uint8_t expected[32] = {0};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc td = {SSZ_KIND_BASIC, 8, NULL, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 8, &td, root, err);
    ASSERT_EQ(ret, 0);
    ASSERT_BYTES_EQ(root, expected, 32);
}

TEST(ethereum_validator_index) {
    uint8_t data[] = {0x2A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}; // 42
    uint8_t expected[32] = {0x2A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                            0, 0, 0, 0, 0, 0, 0, 0};
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc td = {SSZ_KIND_BASIC, 8, NULL, NULL, 0, 0};
    int ret = ssz_stream_root_from_buffer(data, 8, &td, root, err);
    ASSERT_EQ(ret, 0);
    ASSERT_BYTES_EQ(root, expected, 32);
}

/* ===== STRESS TESTS ===== */

TEST(stress_alternating_pattern) {
    uint8_t data[128];
    for (int i = 0; i < 128; i++) data[i] = (i % 2) ? 0xFF : 0x00;
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 200};
    int ret = ssz_stream_root_from_buffer(data, 128, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(stress_sequential_pattern) {
    uint8_t data[256];
    for (int i = 0; i < 256; i++) data[i] = i;
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 500};
    int ret = ssz_stream_root_from_buffer(data, 256, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(stress_all_zeros) {
    uint8_t data[512];
    memset(data, 0, 512);
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 1000};
    int ret = ssz_stream_root_from_buffer(data, 512, &td, root, err);
    ASSERT_EQ(ret, 0);
}

TEST(stress_all_ones) {
    uint8_t data[512];
    memset(data, 0xFF, 512);
    uint8_t root[32];
    char err[128] = {0};
    TypeDesc elem_td = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
    TypeDesc td = {SSZ_KIND_LIST, 0, &elem_td, NULL, 0, 1000};
    int ret = ssz_stream_root_from_buffer(data, 512, &td, root, err);
    ASSERT_EQ(ret, 0);
}

/* ===== MAIN TEST RUNNER ===== */

int main(void) {
    printf("=== SSZ Universal Verifier C Test Suite ===\n");
    printf("Running comprehensive tests...\n\n");

    /* Basic types */
    printf("--- Basic Types ---\n");
    RUN_TEST(uint8_zero);
    RUN_TEST(uint8_max);
    RUN_TEST(uint16_zero);
    RUN_TEST(uint16_max);
    RUN_TEST(uint32_zero);
    RUN_TEST(uint32_max);
    RUN_TEST(uint64_zero);
    RUN_TEST(uint64_max);
    RUN_TEST(uint256_zero);
    RUN_TEST(uint256_max);
    RUN_TEST(bool_false);
    RUN_TEST(bool_true);

    /* Vectors */
    printf("\n--- Vectors ---\n");
    RUN_TEST(vector_empty);
    RUN_TEST(vector_single_uint8);
    RUN_TEST(vector_two_uint8);
    RUN_TEST(vector_32_uint8);
    RUN_TEST(vector_64_uint8);
    RUN_TEST(vector_128_uint8);
    RUN_TEST(vector_uint16_two_elements);
    RUN_TEST(vector_uint32_four_elements);
    RUN_TEST(vector_uint64_two_elements);

    /* Lists */
    printf("\n--- Lists ---\n");
    RUN_TEST(list_empty);
    RUN_TEST(list_single_uint8);
    RUN_TEST(list_two_uint8);
    RUN_TEST(list_32_uint8);
    RUN_TEST(list_64_uint8);
    RUN_TEST(list_uint16_elements);
    RUN_TEST(list_uint32_elements);
    RUN_TEST(list_uint64_elements);

    /* Edge cases */
    printf("\n--- Edge Cases ---\n");
    RUN_TEST(edge_exact_chunk_boundary);
    RUN_TEST(edge_just_over_chunk);
    RUN_TEST(edge_multiple_chunks);
    RUN_TEST(edge_large_list);
    RUN_TEST(edge_power_of_two_sizes);
    RUN_TEST(edge_max_depth_shallow);

    /* Ethereum test vectors */
    printf("\n--- Ethereum Test Vectors ---\n");
    RUN_TEST(ethereum_empty_bytes32);
    RUN_TEST(ethereum_slot_zero);
    RUN_TEST(ethereum_validator_index);

    /* Stress tests */
    printf("\n--- Stress Tests ---\n");
    RUN_TEST(stress_alternating_pattern);
    RUN_TEST(stress_sequential_pattern);
    RUN_TEST(stress_all_zeros);
    RUN_TEST(stress_all_ones);

    printf("\n=== Test Summary ===\n");
    printf("Tests run: %d\n", tests_run);
    printf("Tests passed: %d\n", tests_passed);
    printf("Tests failed: %d\n", tests_run - tests_passed);

    if (tests_run == tests_passed) {
        printf("\n✓ ALL TESTS PASSED\n");
        return 0;
    } else {
        printf("\n✗ SOME TESTS FAILED\n");
        return 1;
    }
}
