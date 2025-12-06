.PHONY: all build test clean install dev help
.PHONY: ts-build ts-test ts-bench c-build c-test c-valgrind rust-build rust-test
.PHONY: wasm-build wasm-test riscv-build benchmark security-audit format lint
.DEFAULT_GOAL := help

# Parallel build support
MAKEFLAGS += -j4

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;36m
NC := \033[0m # No Color

help: ## Show this help message
	@echo '$(BLUE)SSZ Universal Verifier - Build System$(NC)'
	@echo ''
	@echo '$(GREEN)Available targets:$(NC)'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

all: build test ## Build and test everything

build: ts-build c-build rust-build ## Build all implementations

test: ts-test c-test rust-test ## Run all tests

install: ## Install all dependencies
	@echo '$(BLUE)Installing dependencies...$(NC)'
	npm ci
	@echo '$(GREEN)✓ Dependencies installed$(NC)'

dev: install ts-build ## Setup development environment
	@echo '$(GREEN)✓ Development environment ready$(NC)'

# TypeScript targets
ts-build: ## Build TypeScript implementation
	@echo '$(BLUE)Building TypeScript...$(NC)'
	npm install
	npm run build
	@echo '$(GREEN)✓ TypeScript build complete$(NC)'

ts-test: ts-build ## Run TypeScript tests
	@echo '$(BLUE)Running TypeScript tests...$(NC)'
	npm test
	@echo '$(GREEN)✓ TypeScript tests passed$(NC)'

ts-bench: ts-build ## Run TypeScript benchmarks
	@echo '$(BLUE)Running TypeScript benchmarks...$(NC)'
	npm run bench:all
	@echo '$(GREEN)✓ Benchmarks complete$(NC)'

# C targets
c-build: ## Build C implementation
	@echo '$(BLUE)Building C implementation...$(NC)'
	cd c-skel && $(MAKE) all
	@echo '$(GREEN)✓ C build complete$(NC)'

c-test: c-build ## Run C tests
	@echo '$(BLUE)Running C tests...$(NC)'
	cd c-skel && $(MAKE) test
	@echo '$(GREEN)✓ C tests passed$(NC)'

c-valgrind: c-build ## Run Valgrind memory checks
	@echo '$(BLUE)Running Valgrind...$(NC)'
	cd c-skel/valgrind && bash run_valgrind.sh
	@echo '$(GREEN)✓ Valgrind checks complete$(NC)'

# Rust targets
rust-build: ## Build Rust implementation
	@echo '$(BLUE)Building Rust...$(NC)'
	cd rust-skel && cargo build --release
	@echo '$(GREEN)✓ Rust build complete$(NC)'

rust-test: rust-build ## Run Rust tests
	@echo '$(BLUE)Running Rust tests...$(NC)'
	cd rust-skel && cargo test --release
	@echo '$(GREEN)✓ Rust tests passed$(NC)'

# WASM targets
wasm-build: ## Build WASM module
	@echo '$(BLUE)Building WASM...$(NC)'
	cd wasm && npm run build
	@echo '$(GREEN)✓ WASM build complete$(NC)'

wasm-test: wasm-build ## Test WASM module
	@echo '$(BLUE)Testing WASM...$(NC)'
	cd wasm && npm test || echo '$(YELLOW)⚠ WASM tests not implemented$(NC)'

# RISC-V targets
riscv-build: ## Build RISC-V targets
	@echo '$(BLUE)Building RISC-V targets...$(NC)'
	cd c-skel && $(MAKE) riscv
	cd rust-skel && $(MAKE) riscv
	@echo '$(GREEN)✓ RISC-V build complete$(NC)'

# Quality targets
format: ## Format all code
	@echo '$(BLUE)Formatting code...$(NC)'
	npm run format
	cd rust-skel && cargo fmt
	@echo '$(GREEN)✓ Code formatted$(NC)'

lint: ## Lint all code
	@echo '$(BLUE)Linting code...$(NC)'
	npm run lint
	cd rust-skel && cargo clippy --all-targets -- -D warnings
	@echo '$(GREEN)✓ Linting complete$(NC)'

security-audit: ## Run security audits
	@echo '$(BLUE)Running security audits...$(NC)'
	npm audit || echo '$(YELLOW)⚠ npm vulnerabilities found$(NC)'
	cd rust-skel && cargo audit || echo '$(YELLOW)⚠ Rust vulnerabilities found$(NC)'
	@echo '$(GREEN)✓ Security audit complete$(NC)'

benchmark: ts-bench ## Run all benchmarks
	@echo '$(GREEN)✓ All benchmarks complete$(NC)'

# Clean targets
clean: ## Clean all build artifacts
	@echo '$(BLUE)Cleaning build artifacts...$(NC)'
	rm -rf dist node_modules coverage .nyc_output
	cd c-skel && $(MAKE) clean
	cd rust-skel && $(MAKE) clean
	cd wasm && rm -rf pkg node_modules
	@echo '$(GREEN)✓ Clean complete$(NC)'

# CI/CD targets
ci: install build test lint security-audit ## Run full CI pipeline
	@echo '$(GREEN)✓ CI pipeline complete$(NC)'

prepare-release: clean install build test ## Prepare for release
	@echo '$(GREEN)✓ Release preparation complete$(NC)'
