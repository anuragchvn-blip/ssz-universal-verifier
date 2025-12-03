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
all: fuzz_ssz fuzz_ssz_persistent

# Traditional AFL mode
fuzz_ssz: fuzz_ssz.c $(SOURCES) $(HEADERS)
	$(AFL_CC) $(AFLFLAGS) -I$(INCLUDE_DIR) -o $@ fuzz_ssz.c $(SOURCES)

# Persistent mode (10x faster)
fuzz_ssz_persistent: fuzz_ssz.c $(SOURCES) $(HEADERS)
	$(AFL_CLANG) $(AFLFLAGS) -I$(INCLUDE_DIR) -o $@ fuzz_ssz.c $(SOURCES)

# Non-AFL build for debugging
debug: fuzz_ssz.c $(SOURCES) $(HEADERS)
	$(CC) $(CFLAGS) -I$(INCLUDE_DIR) -o fuzz_ssz_debug fuzz_ssz.c $(SOURCES)

# Run fuzzing
fuzz: fuzz_ssz_persistent
	mkdir -p findings
	afl-fuzz -i seeds/ -o findings/ ./fuzz_ssz_persistent

# Clean
clean:
	rm -f fuzz_ssz fuzz_ssz_persistent fuzz_ssz_debug
	rm -rf findings/

# Corpus minimization
minimize: fuzz_ssz
	afl-cmin -i findings/master/queue -o seeds_min -- ./fuzz_ssz @@

.PHONY: all fuzz clean minimize debug
