# Contributing to SSZ Universal Verifier

Thank you for your interest in contributing! This project aims to be the most reliable, minimal, and universal SSZ verification primitive.

## 🎯 Project Goals

1. **Zero Dependencies** - Keep runtime dependencies at 0
2. **Minimal & Auditable** - Every line must justify its existence
3. **Universal** - Support TypeScript, C, Rust, WASM, and embedded platforms
4. **Production-Grade** - 100% test coverage, comprehensive fuzzing
5. **Deterministic** - Identical behavior across all platforms

## 🚀 Getting Started

```bash
# Clone and build
git clone https://github.com/anuragchvn-blip/ssz-universal-verifier.git
cd ssz-universal-verifier
npm install
npm run build

# Run all tests
npm test                           # TypeScript (59 tests)
cd c-skel && make test            # C (42 tests)
cd ../rust-skel && cargo test    # Rust (17 tests)
```

## 📝 Contribution Guidelines

### Code Quality
- **TypeScript**: Strict mode, explicit types, no `any`
- **C**: C11 standard, `no_std` friendly, fixed-size buffers
- **Rust**: `#![no_std]`, `unsafe` only when necessary with justification
- **Tests**: Every feature needs tests, aim for 100% coverage

### Before Submitting
1. ✅ All tests pass (`npm test`, `make test`, `cargo test`)
2. ✅ No new runtime dependencies added
3. ✅ Code is formatted (`npm run format`)
4. ✅ Documentation updated if API changes
5. ✅ Commit messages are clear and descriptive

### Pull Request Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with clear commit messages
4. Run all tests and ensure they pass
5. Update documentation if needed
6. Submit PR with description of changes

### What We're Looking For
- 🐛 Bug fixes with test cases
- ✨ Performance improvements with benchmarks
- 📚 Documentation improvements
- 🔒 Security enhancements
- 🧪 Additional test coverage
- 🌍 Platform support (new architectures)

### What We Won't Accept
- ❌ New runtime dependencies (dev dependencies OK)
- ❌ Breaking changes without strong justification
- ❌ Untested code
- ❌ Non-deterministic behavior
- ❌ Floating point arithmetic
- ❌ Code that increases LOC significantly without clear value

## 🔒 Security

Found a security issue? Please email security concerns privately rather than opening public issues. See [SECURITY.md](docs/SECURITY.md) for details.

## 🧪 Testing

### TypeScript
```bash
npm test              # Run all 59 tests
npm run test:basic    # Basic tests only
npm run test:extended # Extended tests
npm run bench         # Performance benchmarks
```

### C
```bash
cd c-skel
make test            # Run 42 tests
make fuzz            # AFL++ fuzzing
make valgrind        # Memory safety checks
```

### Rust
```bash
cd rust-skel
cargo test           # Run 17 tests
cargo test --release # Release mode tests
```

## 📐 Code Style

### TypeScript
- Use explicit types, avoid `any`
- Prefer functional patterns
- Document public APIs with JSDoc
- Keep functions small and focused

### C
- Follow C11 standard
- Use `snake_case` for functions
- Keep functions under 50 lines when possible
- Document complex algorithms

### Rust
- Follow Rust conventions
- Use `cargo fmt` before committing
- Document public APIs
- Prefer safe Rust, justify `unsafe`

## 🎓 Learning Resources

- [SSZ Specification](https://github.com/ethereum/consensus-specs/blob/dev/ssz/simple-serialize.md)
- [Project Documentation](docs/)
- [API Reference](docs/API.md)
- [Security Analysis](docs/SECURITY.md)

## 💬 Communication

- **GitHub Issues** - Bug reports and feature requests
- **Pull Requests** - Code contributions
- **Discussions** - Questions and ideas

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You

Every contribution, no matter how small, helps make SSZ verification more reliable and accessible. Thank you for being part of this project!
