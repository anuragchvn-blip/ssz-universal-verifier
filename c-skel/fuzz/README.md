# AFL++ Fuzzing for SSZ Universal Verifier

## Setup

### Windows (WSL2)
```bash
# Install AFL++
sudo apt-get update
sudo apt-get install afl++

# Build the fuzzer
cd c-skel/fuzz
make clean
make
```

### Linux
```bash
# Install AFL++
sudo apt-get install afl++

# Build the fuzzer
cd c-skel/fuzz
make clean
make
```

## Running Fuzzing

### Persistent Mode (Recommended - 10x faster)
```bash
# Run with persistent mode
afl-fuzz -i seeds/ -o findings/ ./fuzz_ssz_persistent

# Run for 1M iterations minimum
# Let it run for at least 24 hours
```

### Traditional Mode
```bash
# Run traditional mode
afl-fuzz -i seeds/ -o findings/ ./fuzz_ssz @@
```

### Parallel Fuzzing (Multi-core)
```bash
# Master instance
afl-fuzz -i seeds/ -o findings/ -M master ./fuzz_ssz_persistent &

# Slave instances (one per core)
afl-fuzz -i seeds/ -o findings/ -S slave1 ./fuzz_ssz_persistent &
afl-fuzz -i seeds/ -o findings/ -S slave2 ./fuzz_ssz_persistent &
afl-fuzz -i seeds/ -o findings/ -S slave3 ./fuzz_ssz_persistent &
```

## Checking Results

```bash
# View fuzzing stats
afl-whatsup findings/

# Check for crashes
ls findings/master/crashes/

# Check for hangs
ls findings/master/hangs/

# Reproduce a crash
./fuzz_ssz findings/master/crashes/id:000000*
```

## Corpus Minimization

```bash
# Minimize the corpus after fuzzing
afl-cmin -i findings/master/queue -o seeds_min -- ./fuzz_ssz @@

# Minimize individual test cases
afl-tmin -i findings/master/crashes/id:000000* -o crash_min -- ./fuzz_ssz @@
```

## Performance Tips

1. **Disable ASLR**: `echo 0 | sudo tee /proc/sys/kernel/randomize_va_space`
2. **Set CPU governor**: `sudo cpupower frequency-set -g performance`
3. **Use tmpfs**: Mount findings/ on tmpfs for faster I/O
4. **Disable core dumps**: `ulimit -c 0`

## Target Metrics

- **Executions**: 1,000,000+ iterations
- **Coverage**: 90%+ code coverage
- **Runtime**: 24-72 hours minimum
- **Crashes**: 0 expected (any crash is a critical bug)
- **Hangs**: 0 expected (any hang is a critical bug)

## Integration with CI

```yaml
# .github/workflows/fuzz.yml
name: Fuzzing
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
jobs:
  fuzz:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install AFL++
        run: sudo apt-get install afl++
      - name: Build fuzzer
        run: cd c-skel/fuzz && make
      - name: Run fuzzing
        run: timeout 3600 afl-fuzz -i seeds/ -o findings/ ./fuzz_ssz_persistent
      - name: Check for crashes
        run: |
          if [ -d findings/master/crashes ]; then
            echo "CRASHES FOUND!"
            exit 1
          fi
```
