# CI/CD Pipeline Documentation

This document describes the automated CI/CD workflows for the SSZ Universal Verifier project.

## Overview

The project uses GitHub Actions for continuous integration, testing, and releases. The pipeline ensures code quality, cross-platform compatibility, and automated releases.

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:** Push to main/master, Pull Requests, Manual dispatch

**Jobs:**

#### TypeScript Build & Test
- **Matrix:** Node.js 18.x, 20.x, 22.x
- **Steps:**
  - Install dependencies with npm ci
  - Build TypeScript code
  - Run basic tests (23 tests)
  - Run extended tests (36 tests)
  - Run all tests (59 tests)
  - Run performance benchmarks
  - Type checking with tsc --noEmit
- **Artifacts:** Test results and build output

#### Rust Build & Test
- **Matrix:** Ubuntu, Windows, macOS × stable, nightly Rust
- **Steps:**
  - Build debug and release versions
  - Run all 17 integration tests
  - Format checking (stable only)
  - Clippy lints (stable only)
  - Cargo caching for faster builds
- **Artifacts:** Release binaries (Ubuntu stable)

#### C Build & Test
- **Platform:** Ubuntu latest
- **Steps:**
  - Install build tools
  - Build C implementation
  - Run C tests
- **Artifacts:** Build artifacts (.o files)

#### Cross-compilation
- **Platform:** Ubuntu latest
- **Steps:**
  - Install RISC-V toolchain
  - Cross-compile to RISC-V target
  - Continues on error if toolchain unavailable

#### Code Quality
- **Checks:**
  - TODO/FIXME comments scan
  - File size analysis
  - console.log detection in production code
  
#### Integration Tests
- **Dependencies:** All previous jobs
- **Steps:**
  - Build all implementations
  - Run cross-language compatibility tests
  - Verify 59 TypeScript + 17 Rust tests pass

#### Performance Benchmarks
- **Metrics tracked:**
  - uint64: ~476K ops/sec
  - bytes32: ~909K ops/sec
  - bitlist: ~1M+ ops/sec
  - Throughput: ~1.3 MB/sec
- **Artifacts:** Benchmark results file

#### Security Audit
- **Tools:**
  - npm audit for Node.js dependencies
  - cargo audit for Rust dependencies
  - Audit level: moderate and above

### 2. Documentation Workflow (`.github/workflows/docs.yml`)

**Triggers:** Push to main/master with docs changes, Manual dispatch

**Checks:**
- Broken link detection
- Documentation completeness (API.md, INTEGRATION.md, README.md)
- Structure verification (sections present)
- Documentation summary generation

**Artifacts:** Documentation summary report

### 3. Release Workflow (`.github/workflows/release.yml`)

**Triggers:** 
- Git tags matching `v*.*.*` pattern
- Manual dispatch with version input

**Jobs:**

#### Build Artifacts
- **Platforms:** Linux x64, Windows x64, macOS x64
- **Steps:**
  - Build TypeScript (dist/)
  - Build Rust release binaries
  - Package with README and LICENSE
  - Create platform-specific archives (.tar.gz, .zip)
- **Artifacts:** Platform-specific release packages

#### Create Release
- **Dependencies:** Build artifacts
- **Steps:**
  - Download all platform artifacts
  - Generate changelog
  - Create GitHub release with:
    - Version tag
    - Release notes
    - All platform archives
    
#### Publish to npm
- **Conditions:** Tag push only
- **Steps:**
  - Build TypeScript package
  - Publish to npm registry
  - Requires: `NPM_TOKEN` secret

#### Publish to crates.io
- **Conditions:** Tag push only
- **Steps:**
  - Build Rust crate
  - Publish to crates.io
  - Requires: `CARGO_TOKEN` secret

## Dependency Management

### Dependabot (`.github/dependabot.yml`)

**Automated updates for:**
- **npm packages:** Weekly checks, max 10 PRs
- **Cargo dependencies:** Weekly checks, max 10 PRs  
- **GitHub Actions:** Monthly checks, max 5 PRs

**Labels:** dependencies, javascript/rust/github-actions

## Status Badges

The README includes status badges for:
- CI pipeline status
- TypeScript version
- Rust version
- License

## Configuration Files

### `.github/markdown-link-check.json`
- Configures link checking timeouts
- Ignores localhost links
- Retry configuration for flaky links

## Caching Strategy

**npm dependencies:**
- Automatic caching via `actions/setup-node@v4` with `cache: 'npm'`

**Cargo dependencies:**
- Registry cache: `~/.cargo/registry`
- Index cache: `~/.cargo/git`
- Build cache: `rust-skel/target`
- Keys based on `Cargo.lock` hash

## Required Secrets

For full release automation, configure these repository secrets:

1. **NPM_TOKEN**: npm authentication token for publishing
   - Generate at: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Requires: Automation token type

2. **CARGO_TOKEN**: crates.io API token
   - Generate at: https://crates.io/settings/tokens
   - Requires: Publish scope

3. **GITHUB_TOKEN**: Automatically provided by GitHub Actions
   - Used for: Creating releases, uploading artifacts

## Manual Triggers

All workflows support manual triggering via GitHub UI:
- Go to Actions tab
- Select workflow
- Click "Run workflow"
- Provide inputs if required (e.g., version for releases)

## Branch Protection

Recommended branch protection rules for `main`:

- ✅ Require status checks to pass:
  - TypeScript Build & Test
  - Rust Build & Test
  - C Build & Test
  - Integration Tests
- ✅ Require branches to be up to date
- ✅ Require linear history
- ⚠️ Require pull request reviews (1 approver)

## Performance Monitoring

The CI pipeline tracks performance metrics:
- Benchmark results uploaded as artifacts
- Compare across commits to detect regressions
- Target: <5% regression tolerance

## Troubleshooting

### Build Failures

**TypeScript tests fail:**
- Check Node.js version compatibility (18.x, 20.x, 22.x)
- Verify npm dependencies installed with `npm ci`
- Review test output in Actions logs

**Rust tests fail:**
- Check Rust version (stable vs nightly)
- Review Cargo.lock for dependency conflicts
- Check platform-specific issues (Windows paths, etc.)

**C build fails:**
- Verify build-essential installed
- Check Makefile compatibility with Ubuntu
- Review compiler warnings/errors

### Cache Issues

**Slow builds:**
- Check cache hit rate in Actions logs
- Verify cache key patterns
- Consider clearing cache if corrupted

**Stale dependencies:**
- Update `Cargo.lock` or `package-lock.json`
- Force cache invalidation by modifying keys

### Release Issues

**Release workflow fails:**
- Verify tag format: `v1.2.3`
- Check secrets configured (NPM_TOKEN, CARGO_TOKEN)
- Review artifact packaging for platform

**npm/crates.io publish fails:**
- Verify package name not taken
- Check version not already published
- Review token permissions

## Local Testing

Test workflows locally before pushing:

```bash
# Install act (GitHub Actions local runner)
# https://github.com/nektos/act

# Run CI workflow
act push -W .github/workflows/ci.yml

# Run specific job
act -j typescript -W .github/workflows/ci.yml

# With secrets
act -s NPM_TOKEN=your_token
```

## Metrics & Monitoring

**Success criteria:**
- ✅ All CI jobs pass on main branch
- ✅ Test coverage: 59 TypeScript + 17 Rust tests
- ✅ Build time: <10 minutes total
- ✅ Zero security vulnerabilities (moderate+)
- ✅ Documentation: 100% coverage

**Monitored metrics:**
- Build duration trends
- Test pass rates
- Dependency update frequency
- Security audit findings
- Performance benchmark trends

## Future Improvements

Potential enhancements:
- [ ] Code coverage reporting (Istanbul, tarpaulin)
- [ ] Deploy preview environments for PRs
- [ ] Automated performance regression detection
- [ ] Matrix testing across more platforms (ARM, Alpine Linux)
- [ ] Container image publishing (Docker Hub, GHCR)
- [ ] WASM build and publishing
- [ ] Automated security scanning (CodeQL, Snyk)
- [ ] Integration with external test services
