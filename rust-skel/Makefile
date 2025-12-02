.PHONY: all build test riscv clean

all: build

build:
	cargo build --release

test:
	cargo test

riscv:
	@echo "Cross-compiling for RISC-V..."
	cargo build --release --target riscv64gc-unknown-linux-gnu || \
	cargo build --release --target riscv64imac-unknown-none-elf || \
	echo "RISC-V target not installed. Run: rustup target add riscv64gc-unknown-linux-gnu"

clean:
	cargo clean
