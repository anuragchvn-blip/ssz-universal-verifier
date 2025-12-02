CC = gcc
RISCV_CC = riscv64-unknown-elf-gcc
CFLAGS = -std=c11 -Wall -Wextra -Iinclude -DHOST_TEST
RISCV_CFLAGS = -std=c11 -Wall -Iinclude -nostdlib

SRC = src/ssz_stream.c src/hash.c
OBJ = $(SRC:.c=.o)

.PHONY: all clean test riscv

all: libssz_stream.a

libssz_stream.a: $(OBJ)
	ar rcs $@ $^

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

test: all
	@echo "C skeleton compiled successfully (tests require manual implementation)"

riscv:
	@echo "Cross-compiling for RISC-V (requires $(RISCV_CC))..."
	$(RISCV_CC) $(RISCV_CFLAGS) -c src/ssz_stream.c -o src/ssz_stream.riscv.o
	$(RISCV_CC) $(RISCV_CFLAGS) -c src/hash.c -o src/hash.riscv.o
	@echo "RISC-V objects created: src/*.riscv.o"

clean:
	rm -f $(OBJ) libssz_stream.a src/*.riscv.o
