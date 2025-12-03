#!/bin/bash
# AFL++ 10M iteration fuzzing campaign for SSZ verifier
# Phase 3: Trust - Find any bugs through comprehensive fuzzing

cd "$(dirname "$0")"

echo "=================================="
echo "AFL++ Fuzzing Campaign"
echo "Target: 10,000,000 iterations"
echo "Mode: Persistent (10x faster)"
echo "=================================="
echo ""

# Clean previous run
rm -rf findings/

# Configure system (WSL requires bypassing crash detection)
export AFL_I_DONT_CARE_ABOUT_MISSING_CRASHES=1

# Start fuzzing
echo "Starting fuzzer..."
echo "This will run until 10M iterations or you press Ctrl+C"
echo ""

# Run AFL with stats display
afl-fuzz -i seeds/ -o findings/ -s 123 ./fuzz_ssz_persistent

echo ""
echo "Fuzzing complete!"
echo "Results saved to findings/"
