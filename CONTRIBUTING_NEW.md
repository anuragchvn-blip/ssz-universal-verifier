# Contributing to SSZ Universal Verifier

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ssz-universal-verifier.git`
3. Create a branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Run tests: `make test`
6. Commit: `git commit -s -m "feat: add new feature"`
7. Push: `git push origin feature/your-feature`
8. Open a Pull Request

## 📝 Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples:**
```
feat(typescript): add batch verification API
fix(rust): correct bitlist padding validation
docs: update performance benchmarks
perf(c): optimize merkleization loop
```

## 🧪 Testing Requirements

All contributions must include tests:

### TypeScript
```bash
npm run build
npm test
```

### Rust
```bash
cd rust-skel
cargo test --release
```

### C
```bash
cd c-skel
make test
```

### Integration
```bash
make ci  # Run full CI pipeline locally
```

## 📊 Code Quality Standards

### TypeScript
- Use TypeScript strict mode
- Follow Prettier formatting
- Document public APIs with JSDoc
- Maintain test coverage > 80%

### Rust
- Follow `rustfmt` formatting
- Pass `clippy` lints
- Use `#![no_std]` compatible code
- Document with rustdoc

### C
- Follow C11 standard
- Pass MISRA C compliance checks
- Document with Doxygen-style comments
- Zero Valgrind errors

## 🔒 Security

- Report security issues privately to the maintainers
- Do not open public issues for vulnerabilities
- Include CVE identifiers if applicable

## 📈 Performance

- Benchmark before and after changes
- Document performance impact in PR
- Aim for no regression in common cases
- Profile suspicious code paths

## 🎯 Pull Request Process

1. **Update Documentation**: Ensure docs reflect changes
2. **Add Tests**: Include tests for new functionality
3. **Run CI Locally**: `make ci` before pushing
4. **Update Changelog**: Add entry to CHANGELOG.md
5. **Request Review**: Tag appropriate reviewers
6. **Address Feedback**: Respond to review comments
7. **Squash Commits**: Clean up commit history if needed

## 🌟 Good First Issues

Look for issues labeled `good first issue` or `help wanted`.

## 💬 Communication

- GitHub Issues: Bug reports and feature requests
- Discussions: Questions and ideas
- Pull Requests: Code contributions

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

Thank you for making SSZ Universal Verifier better! 🎉
