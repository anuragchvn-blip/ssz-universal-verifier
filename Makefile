.PHONY: all ts-build ts-test c-build c-test rust-build riscv-build wasm clean

all: ts-build c-build rust-build

ts-build:
	npm install
	npm run build

ts-test: ts-build
	npm test

c-build:
	cd c-skel && $(MAKE) all

c-test: c-build
	cd c-skel && $(MAKE) test

rust-build:
	cd rust-skel && $(MAKE) build

riscv-build:
	@echo "Building RISC-V targets..."
	cd c-skel && $(MAKE) riscv
	cd rust-skel && $(MAKE) riscv

wasm:
	npm run build:wasm

clean:
	rm -rf dist node_modules
	cd c-skel && $(MAKE) clean
	cd rust-skel && $(MAKE) clean
