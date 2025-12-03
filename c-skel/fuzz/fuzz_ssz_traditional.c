#include <stdint.h>
#include <stddef.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include "../include/ssz_stream.h"

/* AFL++ traditional mode fuzzing harness for SSZ verifier */

/* Type descriptors for fuzzing */
static TypeDesc basic_u8 = {SSZ_KIND_BASIC, 1, NULL, NULL, 0, 0};
static TypeDesc basic_u16 = {SSZ_KIND_BASIC, 2, NULL, NULL, 0, 0};
static TypeDesc basic_u32 = {SSZ_KIND_BASIC, 4, NULL, NULL, 0, 0};
static TypeDesc basic_u64 = {SSZ_KIND_BASIC, 8, NULL, NULL, 0, 0};
static TypeDesc basic_u256 = {SSZ_KIND_BASIC, 32, NULL, NULL, 0, 0};

static TypeDesc list_u8 = {SSZ_KIND_LIST, 0, &basic_u8, NULL, 0, 1000};
static TypeDesc list_u32 = {SSZ_KIND_LIST, 0, &basic_u32, NULL, 0, 256};
static TypeDesc list_u64 = {SSZ_KIND_LIST, 0, &basic_u64, NULL, 0, 128};

static TypeDesc vector_u8 = {SSZ_KIND_VECTOR, 32, &basic_u8, NULL, 0, 0};
static TypeDesc vector_u32 = {SSZ_KIND_VECTOR, 16, &basic_u32, NULL, 0, 0};

/* Array of type descriptors to fuzz */
static TypeDesc *type_descriptors[] = {
    &basic_u8,
    &basic_u16,
    &basic_u32,
    &basic_u64,
    &basic_u256,
    &list_u8,
    &list_u32,
    &list_u64,
    &vector_u8,
    &vector_u32
};

#define NUM_TYPES (sizeof(type_descriptors) / sizeof(TypeDesc*))
#define MAX_INPUT_SIZE 10000

int main(int argc, char **argv) {
    static unsigned char buf[MAX_INPUT_SIZE];
    ssize_t len = read(STDIN_FILENO, buf, MAX_INPUT_SIZE);
    
    if (len <= 0) {
        return 0;
    }
    
    if (len < 1) return 0;
    
    /* First byte selects the type descriptor */
    uint8_t type_idx = buf[0] % NUM_TYPES;
    TypeDesc *td = type_descriptors[type_idx];
    
    /* Rest of the bytes are the SSZ data */
    const uint8_t *data = buf + 1;
    size_t data_len = len - 1;
    
    uint8_t root[32];
    char errbuf[128];
    
    /* Fuzz the SSZ verifier - should not crash */
    ssz_stream_root_from_buffer(data, data_len, td, root, errbuf);
    
    return 0;
}
