#!/bin/bash
# 24-hour AFL++ fuzzing campaign
# Run from c-skel/fuzz/ directory

export AFL_I_DONT_CARE_ABOUT_MISSING_CRASHES=1
export AFL_SKIP_CPUFREQ=1

cd /mnt/c/Users/Windows/ssz-universal-verifier/c-skel/fuzz

# Build if needed
if [ ! -f fuzz_ssz_persistent ]; then
    echo "[*] Building fuzzer..."
    make clean
    make fuzz_ssz_persistent
fi

echo "[*] Starting 24-hour AFL++ fuzzing campaign..."
echo "[*] Start time: $(date)"
echo "[*] Will run until: $(date -d '+24 hours')"
echo "[*] Log file: fuzz_24h.log"
echo "[*] Results: findings/"

# Clean old findings
rm -rf findings_24h/
mkdir -p findings_24h/

# Start fuzzing with 24-hour timeout (86400 seconds)
timeout 86400 afl-fuzz -i seeds/ -o findings_24h/ ./fuzz_ssz_persistent

echo "[*] Fuzzing completed at: $(date)"
echo "[*] Results saved to findings_24h/"

# Generate summary
if [ -d findings_24h/default/ ]; then
    echo ""
    echo "=== SUMMARY ==="
    echo "Crashes: $(ls findings_24h/default/crashes/ 2>/dev/null | wc -l)"
    echo "Hangs: $(ls findings_24h/default/hangs/ 2>/dev/null | wc -l)"
    echo "Corpus: $(ls findings_24h/default/queue/ 2>/dev/null | wc -l)"
    
    if [ -f findings_24h/default/fuzzer_stats ]; then
        echo ""
        grep "execs_done\|crashes_found\|hangs_found\|corpus_count\|stability" findings_24h/default/fuzzer_stats
    fi
fi
