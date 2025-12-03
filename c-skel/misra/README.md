# MISRA C:2012 Compliance

## Overview

MISRA C is a set of software development guidelines for the C programming language developed by the Motor Industry Software Reliability Association (MISRA). It aims to promote safety, security, portability, and reliability in embedded systems.

## Why MISRA C?

For safety-critical and embedded systems, MISRA C provides:

1. **Memory Safety**: Rules to prevent buffer overflows, pointer errors
2. **Predictable Behavior**: Avoids undefined behavior in C
3. **Portability**: Code works across different compilers and platforms
4. **Maintainability**: Enforces clear, readable code
5. **Industry Standard**: Required for automotive, aerospace, medical devices

## Running MISRA C Checks

### Quick Start (WSL2 on Windows)

```bash
# Install cppcheck with MISRA addon
sudo apt-get update
sudo apt-get install cppcheck

# Download MISRA addon (if not included)
wget https://raw.githubusercontent.com/danmar/cppcheck/main/addons/misra.py -O /usr/share/cppcheck/addons/misra.py

# Run checks
cd c-skel/misra
./check_misra.sh
```

### Linux

```bash
# Install cppcheck
sudo apt-get install cppcheck  # Debian/Ubuntu
sudo dnf install cppcheck      # Fedora/RHEL

# Run checks
cd c-skel/misra
./check_misra.sh
```

### Windows (Native)

```powershell
# Download cppcheck from https://cppcheck.sourceforge.io/
# Install to C:\Program Files\Cppcheck

# Run checks
cd c-skel\misra
powershell -ExecutionPolicy Bypass -File .\check_misra.ps1
```

## MISRA C:2012 Rule Categories

### Mandatory Rules (143 rules)
**Must comply** - No deviations without formal approval

Examples:
- Rule 1.3: No undefined/unspecified behavior
- Rule 2.2: No dead code
- Rule 9.1: No uninitialized variables
- Rule 21.3: No malloc/free in safety-critical code

### Required Rules (143 rules)
**Should comply** - Deviations need justification

Examples:
- Rule 8.7: Functions used in one file should be static
- Rule 10.1: Operands shall not be of inappropriate type
- Rule 16.4: Every switch should have a default
- Rule 17.7: Return values should be used

### Advisory Rules (84 rules)
**May comply** - Recommended best practices

Examples:
- Rule 2.3: Unused type declarations should be removed
- Rule 8.13: Pointer parameters should be const when possible
- Rule 15.5: Function should have single point of exit
- Rule 20.9: stdio.h should not be used in production

## Common MISRA C Violations in C Code

### 1. Uninitialized Variables (Rule 9.1 - Mandatory)
```c
// ✗ BAD
uint8_t buffer[32];
memcpy(dest, buffer, 32); // buffer not initialized!

// ✓ GOOD
uint8_t buffer[32] = {0};
memcpy(dest, buffer, 32);
```

### 2. Pointer Arithmetic (Rule 18.4 - Advisory)
```c
// ✗ BAD (for strict embedded)
uint8_t *p = buffer;
p++; // pointer arithmetic

// ✓ GOOD (index-based)
for (size_t i = 0; i < len; i++) {
    buffer[i] = value;
}
```

### 3. Magic Numbers (Rule 10.3 - Required)
```c
// ✗ BAD
if (len > 32) { ... }

// ✓ GOOD
#define SSZ_CHUNK_SIZE 32
if (len > SSZ_CHUNK_SIZE) { ... }
```

### 4. Type Casting (Rule 11.5 - Required)
```c
// ✗ BAD
void *ptr = malloc(32);
uint8_t *buf = ptr; // implicit cast

// ✓ GOOD
void *ptr = malloc(32);
uint8_t *buf = (uint8_t *)ptr; // explicit cast
```

### 5. Missing Default (Rule 16.4 - Required)
```c
// ✗ BAD
switch (type) {
    case TYPE_A: break;
    case TYPE_B: break;
}

// ✓ GOOD
switch (type) {
    case TYPE_A: break;
    case TYPE_B: break;
    default: 
        /* Unreachable */
        assert(0);
        break;
}
```

### 6. Unused Return Values (Rule 17.7 - Required)
```c
// ✗ BAD
sha256_hash(data, len, out);

// ✓ GOOD
int ret = sha256_hash(data, len, out);
if (ret != 0) {
    return ret;
}
```

### 7. Complex Expressions (Rule 12.1 - Advisory)
```c
// ✗ BAD
if (a && b || c && d) { ... }

// ✓ GOOD
if ((a && b) || (c && d)) { ... }
```

### 8. Recursion (Rule 17.2 - Required)
```c
// ✗ BAD (for safety-critical)
void merkleize_recursive(node *n) {
    if (n->left) merkleize_recursive(n->left);
    if (n->right) merkleize_recursive(n->right);
}

// ✓ GOOD (iterative with stack)
void merkleize_iterative(node *n) {
    node *stack[MAX_DEPTH];
    size_t sp = 0;
    // ... iterative implementation
}
```

## SSZ Verifier MISRA C Compliance

### Target Compliance Level

**Level**: MISRA C:2012 Compliance Level 2
- ✅ All Mandatory rules
- ✅ All Required rules
- ⚠️ Advisory rules where practical

### Known Deviations

Document any intentional deviations:

```c
/* MISRA Deviation: Rule 21.3
 * Rationale: Dynamic allocation needed for variable-size SSZ objects
 * Mitigation: Bounded allocation with max_length checks
 * Approved by: [Name], [Date]
 */
// cppcheck-suppress misra-c2012-21.3
uint8_t *buffer = malloc(bounded_size);
```

### Suppression Comments

For false positives:

```c
// cppcheck-suppress misra-c2012-11.5
uint8_t *ptr = (uint8_t *)generic_ptr; // Justified cast
```

## Automated Compliance Checking

### GitHub Actions Integration

```yaml
name: MISRA C Compliance
on: [push, pull_request]

jobs:
  misra:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install cppcheck
        run: sudo apt-get install cppcheck
      
      - name: Run MISRA C checks
        run: |
          cd c-skel/misra
          ./check_misra.sh
      
      - name: Upload compliance report
        uses: actions/upload-artifact@v3
        with:
          name: misra-compliance-report
          path: c-skel/build/misra/compliance_report.md
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

cd c-skel/misra
./check_misra.sh

if [ $? -ne 0 ]; then
    echo "MISRA C violations detected. Commit blocked."
    echo "Run './check_misra.sh' to see details."
    exit 1
fi
```

## Compliance Report Example

```markdown
# MISRA C:2012 Compliance Report

**Date**: 2025-12-03
**Standard**: MISRA C:2012
**Tool**: cppcheck 2.10

## Summary

| Category | Count |
|----------|-------|
| Total Violations | 5 |
| Mandatory | 0 ✅ |
| Required | 2 ⚠️ |
| Advisory | 3 ℹ️ |

## Status: ⚠️ PARTIAL COMPLIANCE

All mandatory rules satisfied.
2 required violations need attention.
```

## Tools for MISRA C

1. **cppcheck** (Free, open-source)
   - Good coverage of MISRA rules
   - Actively maintained
   - CI/CD friendly

2. **PC-lint/FlexeLint** (Commercial)
   - Industry standard
   - Comprehensive MISRA coverage
   - Expensive ($1000+)

3. **Coverity** (Commercial)
   - Advanced static analysis
   - Excellent MISRA support
   - Enterprise pricing

4. **LDRA** (Commercial)
   - Safety-critical certification
   - Complete MISRA coverage
   - Very expensive

## Further Reading

- [MISRA C:2012 Guidelines](https://www.misra.org.uk/misra-c/)
- [Embedded C Coding Standard](https://barrgroup.com/embedded-systems/books/embedded-c-coding-standard)
- [CERT C Coding Standard](https://wiki.sei.cmu.edu/confluence/display/c/SEI+CERT+C+Coding+Standard)
- [JPL C Coding Standard](https://lars-lab.jpl.nasa.gov/JPL_Coding_Standard_C.pdf)

## Target Metrics

For production deployment:

- ✅ 0 mandatory violations
- ✅ 0 required violations
- ✅ <10 advisory violations (with justifications)
- ✅ All deviations documented
- ✅ Formal safety review completed

**Safety-critical code demands zero tolerance for mandatory/required violations.**
