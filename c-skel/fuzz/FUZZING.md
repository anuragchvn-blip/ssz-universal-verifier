# AFL++ Fuzzing Campaign - Phase 3: Trust

## Overview

This directory contains the AFL++ fuzzing infrastructure for the SSZ streaming verifier. The goal is to execute 10 million iterations to discover any edge cases, crashes, or unexpected behavior.

## Quick Start

```bash
cd c-skel/fuzz
./run_fuzzing.sh
```

This will start AFL++ in persistent mode (10x faster than traditional fuzzing) and run until completion or manual interruption.

## Build Targets

### Traditional Mode (stdin-based)
```bash
make fuzz_ssz_traditional
```
- Reads test cases from stdin
- Compatible with older afl-gcc
- Instrumented locations: 156 (90 + 62 + 4)

### Persistent Mode (recommended, 10x faster)
```bash
make fuzz_ssz_persistent
```
- Uses AFL++ `__AFL_LOOP()` for in-process fuzzing
- Requires afl-clang-fast
- Instrumented locations: 55 (15 + 24 + 16)
- 10,000 iterations per fork

## Running Fuzzing

### Interactive Fuzzing (recommended)
```bash
./run_fuzzing.sh
```

### Manual AFL Command
```bash
afl-fuzz -i seeds/ -o findings/ ./fuzz_ssz_persistent
```

### Background Fuzzing (tmux/screen)
```bash
tmux new -s fuzz
cd c-skel/fuzz
./run_fuzzing.sh
# Detach: Ctrl+B, then D
```

### Multiple Cores (parallel fuzzing)
```bash
# Terminal 1 (master)
afl-fuzz -i seeds/ -o findings/ -M master ./fuzz_ssz_persistent

# Terminal 2 (secondary)
afl-fuzz -i seeds/ -o findings/ -S secondary01 ./fuzz_ssz_persistent

# Terminal 3 (secondary)
afl-fuzz -i seeds/ -o findings/ -S secondary02 ./fuzz_ssz_persistent
```

## Fuzzing Strategy

### Type Coverage
The fuzzer tests 10 different SSZ type descriptors:
1. **Basic types**: u8, u16, u32, u64, u256
2. **Lists**: List<u8>, List<u32>, List<u64>
3. **Vectors**: Vector<u8, 32>, Vector<u32, 16>

### Input Format
Each test case has:
- **Byte 0**: Type selector (0-9) - chooses which TypeDesc to use
- **Bytes 1+**: SSZ-encoded data to verify

This design allows AFL++ to:
- Explore different type combinations
- Discover edge cases in merkleization
- Find offset parsing bugs
- Test length validation
- Uncover unexpected hash collisions

### Seed Corpus
Located in `seeds/`:
- `basic_u8`: Single byte (0x00)
- `basic_u32`: 4 bytes (0x00010203)
- `basic_u64`: 8 bytes (0x0001020304050607)
- `list_empty`: Empty list (0x00)
- `list_short`: Short list (0x0001020304)
- `list_with_offset`: List with offset encoding (12 bytes)

## Monitoring Progress

### Live Statistics
AFL displays:
- **Execs/sec**: Fuzzing speed (persistent mode: ~20,000/sec)
- **Total execs**: Progress toward 10M goal
- **Unique crashes**: Memory safety violations
- **Unique hangs**: Infinite loops or timeouts
- **Coverage**: Code paths explored
- **Corpus count**: Interesting test cases discovered

### Check Status (if running in background)
```bash
afl-whatsup findings/
```

### View Findings
```bash
# List crashes
ls -la findings/default/crashes/

# List hangs
ls -la findings/default/hangs/

# View crash details
xxd findings/default/crashes/id:000000*
```

## Performance

### Expected Throughput
- **Persistent mode**: ~20,000 execs/sec per core
- **Traditional mode**: ~2,000 execs/sec per core
- **10M iterations**: ~8-10 minutes with persistent mode (1 core)

### Optimization
System has 8 CPU cores. For maximum throughput:
```bash
# Run 7 parallel fuzzers (leave 1 core for system)
./run_parallel_fuzzing.sh 7
```

## Interpreting Results

### No Crashes (Expected)
✅ **GOOD**: C implementation is robust
- Indicates proper bounds checking
- No buffer overflows
- No null pointer dereferences
- Merkleization handles all edge cases

### Crashes Found (Requires Investigation)
⚠️ **ACTION REQUIRED**:
1. Reproduce crash: `./fuzz_ssz_persistent < findings/default/crashes/id:000000*`
2. Debug with gdb: `gdb ./fuzz_ssz_persistent`
3. Run with Valgrind: `valgrind ./fuzz_ssz_persistent < crash_file`
4. Fix root cause in `src/ssz_stream.c`
5. Re-run fuzzing campaign

### Hangs Found
⚠️ **ACTION REQUIRED**:
- Indicates potential infinite loop
- Check for malformed offset cycles
- Review recursion depth limits

## Integration with Battle Plan

### Phase 3: Trust (Current)
- ✅ AFL++ infrastructure created
- ✅ Traditional + Persistent mode fuzzers built
- ✅ Seed corpus created
- 🔄 **10M iteration campaign** (in progress)
- ⏳ Security documentation (next)
- ⏳ Formal proofs (next)

### Success Criteria
- 10,000,000+ total execs
- Zero crashes discovered
- Zero hangs discovered
- >80% code coverage
- All findings documented

## Corpus Minimization

After fuzzing completes:
```bash
make minimize
```

This creates `seeds_min/` with the smallest set of inputs that achieve the same coverage.

## Continuous Fuzzing

For production hardening:
```bash
# Run fuzzer 24/7 on dedicated machine
while true; do
  ./run_fuzzing.sh
  date >> fuzz_history.log
  cp -r findings/ findings_$(date +%Y%m%d_%H%M%S)/
done
```

## Troubleshooting

### "No instrumentation detected"
```bash
# Rebuild with correct AFL compiler
make clean
make fuzz_ssz_persistent
```

### "Suboptimal CPU scaling governor"
```bash
# Set performance mode (requires root)
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

### "Fork server handshake failed"
- Check binary is executable: `chmod +x fuzz_ssz_persistent`
- Test manually: `echo "test" | ./fuzz_ssz_persistent`

### WSL Performance Issues
- Use WSL2 (not WSL1) for better performance
- Run from Linux filesystem (/home), not Windows mount (/mnt/c)
- Consider native Linux VM for production fuzzing

## References

- AFL++ Documentation: https://aflplus.plus/docs/
- Persistent Mode: https://aflplus.plus/docs/persistent_mode/
- Fuzzing Best Practices: https://github.com/AFLplusplus/AFLplusplus/blob/stable/docs/fuzzing_in_depth.md
