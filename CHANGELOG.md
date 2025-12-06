# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enhanced CI/CD pipeline with multi-platform testing
- CodeQL security scanning
- Automated dependency updates via Dependabot
- Performance benchmark workflow
- Documentation link checking
- Prettier code formatting
- EditorConfig for consistent coding styles
- Comprehensive Makefile with colored output
- Build optimization scripts
- Performance documentation guide

### Changed
- Improved TypeScript configuration with stricter type checking
- Enhanced release workflow with ARM64 support
- Updated package.json with more npm scripts
- Better npm package configuration (.npmignore)

### Fixed
- Bitlist padding overflow when paddingBits >= 31
- Offset calculation overflow in TypeScript parser
- Container offset integer overflow in C implementation

### Security
- Added weekly security audits
- Implemented CodeQL scanning
- Enhanced input validation

## [1.0.0] - 2024-12-06

### Added
- Initial release
- TypeScript implementation with 59 comprehensive tests
- Rust no_std implementation with 17 integration tests
- C implementation with 42 unit tests
- WASM bindings for web and Node.js
- RISC-V support
- zkVM integration (experimental)
- Complete API documentation
- Performance benchmarks (476K ops/sec uint64, 1.3 MB/sec throughput)
- Fuzzing infrastructure (584K+ executions, 0 crashes)
- Valgrind memory safety checks
- MISRA C compliance framework

### Supported Platforms
- Linux x86_64
- Linux ARM64
- Windows x64
- macOS x64
- macOS ARM64
- RISC-V
- WebAssembly

[Unreleased]: https://github.com/anuragchvn-blip/ssz-universal-verifier/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/anuragchvn-blip/ssz-universal-verifier/releases/tag/v1.0.0
