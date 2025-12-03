CC = gcc
RISCV_CC = riscv64-unknown-elf-gcc
CFLAGS = -std=c11 -Wall -Wextra -Iinclude -DHOST_TEST -O2
TEST_CFLAGS = -std=c11 -Wall -Wextra -Iinclude -DHOST_TEST -g -O0
RISCV_CFLAGS = -std=c11 -Wall -Iinclude -nostdlib

SRC = src/ssz_stream.c src/hash.c
OBJ = $(SRC:.c=.o)
BUILD_DIR = build

.PHONY: all clean test riscv valgrind misra fuzz

all: libssz_stream.a

libssz_stream.a: $(OBJ)
	ar rcs $@ $^

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# Build comprehensive test suite
test: $(SRC)
	mkdir -p $(BUILD_DIR)
	$(CC) $(TEST_CFLAGS) -o $(BUILD_DIR)/test_ssz tests/test_ssz.c $(SRC)
	@echo ""
	@echo "Running test suite..."
	./$(BUILD_DIR)/test_ssz

# RISC-V cross-compilation
riscv:
	@echo "Cross-compiling for RISC-V (requires $(RISCV_CC))..."
	$(RISCV_CC) $(RISCV_CFLAGS) -c src/ssz_stream.c -o src/ssz_stream.riscv.o
	$(RISCV_CC) $(RISCV_CFLAGS) -c src/hash.c -o src/hash.riscv.o
	@echo "RISC-V objects created: src/*.riscv.o"

# Memory safety checks with Valgrind
valgrind: test
	@echo "Running Valgrind memory safety checks..."
	cd valgrind && bash run_valgrind.sh

# MISRA C compliance
misra:
	@echo "Running MISRA C compliance checks..."
	cd misra && bash check_misra.sh

# AFL fuzzing
fuzz:
	@echo "Building AFL fuzzer..."
	cd fuzz && make
	@echo ""
	@echo "Run fuzzing with: cd fuzz && make fuzz"

clean:
	rm -f $(OBJ) libssz_stream.a src/*.riscv.o
	rm -rf $(BUILD_DIR)
