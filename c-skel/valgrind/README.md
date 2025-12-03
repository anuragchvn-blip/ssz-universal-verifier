# Valgrind Memory Safety Analysis

## Overview

This directory contains scripts and configurations for running Valgrind memory safety analysis on the SSZ Universal Verifier C implementation.

## What is Valgrind?

Valgrind is a programming tool for memory debugging, memory leak detection, and profiling. It can automatically detect many memory management and threading bugs.

## Running Valgrind

### Quick Start (WSL2 on Windows)

```bash
# Install Valgrind
sudo apt-get update
sudo apt-get install valgrind

# Run all checks
cd c-skel/valgrind
./run_valgrind.sh
```

### Linux

```bash
# Install Valgrind
sudo apt-get install valgrind  # Debian/Ubuntu
sudo dnf install valgrind      # Fedora/RHEL

# Run all checks
cd c-skel/valgrind
./run_valgrind.sh
```

### macOS

```bash
# Install Valgrind
brew install valgrind

# Run all checks
cd c-skel/valgrind
./run_valgrind.sh
```

## Checks Performed

### 1. Memory Leak Detection
```bash
valgrind --leak-check=full --show-leak-kinds=all ./test_ssz
```

Detects:
- Definitely lost memory (direct leaks)
- Indirectly lost memory (leaked structures)
- Possibly lost memory (pointers to middle of blocks)
- Still reachable memory (not freed but still accessible)

**Target**: 0 bytes definitely lost, 0 bytes indirectly lost

### 2. Uninitialized Memory
```bash
valgrind --track-origins=yes --undef-value-errors=yes ./test_ssz
```

Detects:
- Use of uninitialized values
- Reading uninitialized memory
- Conditional jumps based on uninitialized values

**Target**: 0 uninitialized reads

### 3. Invalid Memory Access
```bash
valgrind --tool=memcheck --read-var-info=yes ./test_ssz
```

Detects:
- Buffer overflows
- Buffer underflows
- Use after free
- Double free
- Reading/writing freed memory

**Target**: 0 invalid accesses

### 4. Cache Profiling (Optional)
```bash
valgrind --tool=cachegrind ./test_ssz
cg_annotate cachegrind.out
```

Profiles:
- L1/L2/L3 cache hit rates
- Cache miss patterns
- Memory access patterns

**Target**: >95% L1 cache hit rate

### 5. Heap Profiling (Optional)
```bash
valgrind --tool=massif ./test_ssz
ms_print massif.out
```

Profiles:
- Peak memory usage
- Memory allocation patterns
- Stack vs heap usage

**Target**: <1MB peak for typical SSZ operations

## Expected Results

### Clean Output Example
```
==12345== Memcheck, a memory error detector
==12345== Command: ./test_ssz
==12345==
=== SSZ Universal Verifier C Test Suite ===
... all tests pass ...
==12345==
==12345== HEAP SUMMARY:
==12345==     in use at exit: 0 bytes in 0 blocks
==12345==   total heap usage: 100 allocs, 100 frees, 10,240 bytes allocated
==12345==
==12345== All heap blocks were freed -- no leaks are possible
==12345==
==12345== ERROR SUMMARY: 0 errors from 0 contexts
```

### Issue Example (Memory Leak)
```
==12345== 32 bytes in 1 blocks are definitely lost in loss record 1 of 1
==12345==    at 0x4C2AB80: malloc (in /usr/lib/valgrind/vgpreload_memcheck-amd64-linux.so)
==12345==    by 0x400678: ssz_stream_root_from_buffer (ssz_stream.c:42)
==12345==    by 0x400890: test_uint8_zero (test_ssz.c:123)
==12345==    by 0x401000: main (test_ssz.c:456)
```

## Common Issues and Fixes

### 1. Memory Leak
**Issue**: `32 bytes definitely lost`  
**Cause**: Missing `free()` call  
**Fix**: Add `free(ptr)` before function return

### 2. Uninitialized Read
**Issue**: `Conditional jump or move depends on uninitialised value(s)`  
**Cause**: Using variable before initialization  
**Fix**: Initialize all variables: `uint8_t buf[32] = {0};`

### 3. Invalid Write
**Issue**: `Invalid write of size 4`  
**Cause**: Buffer overflow (writing past end of array)  
**Fix**: Check bounds: `if (i < array_size) array[i] = value;`

### 4. Use After Free
**Issue**: `Invalid read of size 8`  
**Cause**: Using pointer after `free(ptr)`  
**Fix**: Set to NULL after free: `free(ptr); ptr = NULL;`

## Integration with CI

### GitHub Actions Example
```yaml
name: Valgrind Memory Safety
on: [push, pull_request]

jobs:
  valgrind:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Valgrind
        run: sudo apt-get install valgrind
      
      - name: Build with debug symbols
        run: |
          cd c-skel
          make clean
          make CFLAGS="-g -O0 -DHOST_TEST" test
      
      - name: Run Valgrind
        run: |
          cd c-skel/valgrind
          ./run_valgrind.sh
      
      - name: Upload logs
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: valgrind-logs
          path: c-skel/build/valgrind-*.log
```

## Performance Impact

Valgrind significantly slows down execution (10-50x slower):

- **Normal execution**: 100ms
- **Valgrind execution**: 1-5 seconds

This is expected and acceptable for testing.

## Limitations

1. **False Positives**: Valgrind may report issues in system libraries (can be suppressed)
2. **Platform Specific**: Some checks only work on Linux
3. **Slow**: Not suitable for production, only testing
4. **Memory Overhead**: Requires significant additional RAM

## Suppression Files

Create `.valgrind-suppress` to ignore known false positives:

```
{
   glibc_dlopen_leak
   Memcheck:Leak
   ...
   fun:dlopen
}
```

Use with: `valgrind --suppressions=.valgrind-suppress ./test_ssz`

## Further Reading

- [Valgrind Quick Start](https://valgrind.org/docs/manual/quick-start.html)
- [Memcheck Manual](https://valgrind.org/docs/manual/mc-manual.html)
- [Common Valgrind Errors](https://valgrind.org/docs/manual/manual-core.html#manual-core.errors)

## Target Metrics

For production-ready code:

- ✅ 0 definitely lost bytes
- ✅ 0 indirectly lost bytes  
- ✅ 0 uninitialized reads
- ✅ 0 invalid accesses
- ✅ 0 double frees
- ✅ 0 use after free
- ✅ Clean exit (all blocks freed)

**Zero tolerance for memory safety issues in cryptographic code.**
