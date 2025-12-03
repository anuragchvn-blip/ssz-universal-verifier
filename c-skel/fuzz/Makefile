CC = gcc
AFL_CC = afl-gcc
AFL_CLANG = afl-clang-fast
CFLAGS = -Wall -Wextra -O2 -g -DHOST_TEST
AFLFLAGS = -Wall -Wextra -O3 -funroll-loops

SRC_DIR = ../src
INCLUDE_DIR = ../include

SOURCES = $(SRC_DIR)/ssz_stream.c $(SRC_DIR)/hash.c
HEADERS = $(INCLUDE_DIR)/ssz_stream.h

# Targets
all: fuzz_ssz_traditional fuzz_ssz_persistent

# Traditional AFL mode (stdin-based, works with afl-gcc)
fuzz_ssz_traditional: fuzz_ssz_traditional.c $(SOURCES) $(HEADERS)
	$(AFL_CC) $(AFLFLAGS) -I$(INCLUDE_DIR) -o $@ fuzz_ssz_traditional.c $(SOURCES)

# Persistent mode (10x faster)
fuzz_ssz_persistent: fuzz_ssz.c $(SOURCES) $(HEADERS)
	$(AFL_CLANG) $(AFLFLAGS) -I$(INCLUDE_DIR) -o $@ fuzz_ssz.c $(SOURCES)

# Non-AFL build for debugging
debug: fuzz_ssz_traditional.c $(SOURCES) $(HEADERS)
	$(CC) $(CFLAGS) -I$(INCLUDE_DIR) -o fuzz_ssz_debug fuzz_ssz_traditional.c $(SOURCES)

# Run fuzzing with persistent mode (10x faster)
fuzz: fuzz_ssz_persistent
	mkdir -p findings
	afl-fuzz -i seeds/ -o findings/ ./fuzz_ssz_persistent

# Run fuzzing with traditional mode (fallback)
fuzz-traditional: fuzz_ssz_traditional
	mkdir -p findings
	afl-fuzz -i seeds/ -o findings/ ./fuzz_ssz_traditional

# Clean
clean:
	rm -f fuzz_ssz_traditional fuzz_ssz_persistent fuzz_ssz_debug
	rm -rf findings/

# Corpus minimization
minimize: fuzz_ssz_traditional
	afl-cmin -i findings/default/queue -o seeds_min -- ./fuzz_ssz_traditional

.PHONY: all fuzz clean minimize debug
