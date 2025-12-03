#!/bin/bash
# MISRA C:2012 Compliance Analysis for SSZ Universal Verifier

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
C_SKEL_DIR="$(dirname "$SCRIPT_DIR")"
SRC_DIR="$C_SKEL_DIR/src"
INCLUDE_DIR="$C_SKEL_DIR/include"
REPORT_DIR="$C_SKEL_DIR/build/misra"

echo "=== SSZ Universal Verifier - MISRA C:2012 Compliance Analysis ==="
echo ""

# Check if cppcheck is installed
if ! command -v cppcheck &> /dev/null; then
    echo "ERROR: cppcheck is not installed"
    echo ""
    echo "Installation instructions:"
    echo "  Ubuntu/Debian: sudo apt-get install cppcheck"
    echo "  Fedora/RHEL:   sudo dnf install cppcheck"
    echo "  macOS:         brew install cppcheck"
    echo "  Windows:       Download from https://cppcheck.sourceforge.io/"
    exit 1
fi

# Create report directory
mkdir -p "$REPORT_DIR"

echo "Running MISRA C:2012 compliance checks..."
echo ""

# Run cppcheck with MISRA addon
cppcheck \
    --addon=misra \
    --enable=all \
    --suppress=missingIncludeSystem \
    --inline-suppr \
    --std=c11 \
    --platform=unix64 \
    -I"$INCLUDE_DIR" \
    --xml \
    --xml-version=2 \
    "$SRC_DIR"/*.c \
    2> "$REPORT_DIR/misra_report.xml"

# Also generate human-readable output
cppcheck \
    --addon=misra \
    --enable=all \
    --suppress=missingIncludeSystem \
    --inline-suppr \
    --std=c11 \
    --platform=unix64 \
    -I"$INCLUDE_DIR" \
    "$SRC_DIR"/*.c \
    2> "$REPORT_DIR/misra_report.txt"

echo ""
echo "MISRA C compliance check complete"
echo ""
echo "Reports generated:"
echo "  - $REPORT_DIR/misra_report.xml"
echo "  - $REPORT_DIR/misra_report.txt"
echo ""

# Parse results
TOTAL_VIOLATIONS=$(grep -c "misra-c" "$REPORT_DIR/misra_report.txt" || echo "0")
MANDATORY_VIOLATIONS=$(grep "misra-c.*Required" "$REPORT_DIR/misra_report.txt" | wc -l || echo "0")
REQUIRED_VIOLATIONS=$(grep "misra-c.*Mandatory" "$REPORT_DIR/misra_report.txt" | wc -l || echo "0")
ADVISORY_VIOLATIONS=$(grep "misra-c.*Advisory" "$REPORT_DIR/misra_report.txt" | wc -l || echo "0")

echo "=== MISRA C Compliance Summary ==="
echo ""
echo "Total violations:     $TOTAL_VIOLATIONS"
echo "  Mandatory:          $MANDATORY_VIOLATIONS"
echo "  Required:           $REQUIRED_VIOLATIONS"
echo "  Advisory:           $ADVISORY_VIOLATIONS"
echo ""

# Show top violations
if [ "$TOTAL_VIOLATIONS" -gt 0 ]; then
    echo "Top violations:"
    echo ""
    grep "misra-c" "$REPORT_DIR/misra_report.txt" | head -20
    echo ""
fi

# Generate compliance report
cat > "$REPORT_DIR/compliance_report.md" << EOF
# MISRA C:2012 Compliance Report

## SSZ Universal Verifier C Implementation

**Date**: $(date +"%Y-%m-%d")
**Standard**: MISRA C:2012
**Tool**: cppcheck with MISRA addon

## Summary

| Category | Count |
|----------|-------|
| Total Violations | $TOTAL_VIOLATIONS |
| Mandatory | $MANDATORY_VIOLATIONS |
| Required | $REQUIRED_VIOLATIONS |
| Advisory | $ADVISORY_VIOLATIONS |

## Compliance Status

EOF

if [ "$MANDATORY_VIOLATIONS" -eq 0 ] && [ "$REQUIRED_VIOLATIONS" -eq 0 ]; then
    echo "✅ **COMPLIANT**: All mandatory and required rules satisfied" >> "$REPORT_DIR/compliance_report.md"
    echo ""
    echo "✓✓✓ MISRA C COMPLIANCE ACHIEVED ✓✓✓"
    echo ""
    echo "Zero mandatory/required violations!"
elif [ "$MANDATORY_VIOLATIONS" -eq 0 ]; then
    echo "⚠️ **PARTIAL**: All mandatory rules satisfied, $REQUIRED_VIOLATIONS required violations" >> "$REPORT_DIR/compliance_report.md"
    echo ""
    echo "⚠ Partial Compliance"
    echo ""
    echo "Fix required violations for full compliance."
else
    echo "❌ **NON-COMPLIANT**: $MANDATORY_VIOLATIONS mandatory violations must be fixed" >> "$REPORT_DIR/compliance_report.md"
    echo ""
    echo "✗ Non-Compliant"
    echo ""
    echo "Critical: Fix mandatory violations immediately!"
fi

# Add detailed violations to report
cat >> "$REPORT_DIR/compliance_report.md" << EOF

## Detailed Violations

\`\`\`
$(cat "$REPORT_DIR/misra_report.txt")
\`\`\`

## MISRA C:2012 Rules Overview

### Mandatory Rules (Must comply)
- Safety-critical violations
- No deviations permitted without formal approval

### Required Rules (Should comply)
- Important for code quality
- Deviations require documented justification

### Advisory Rules (May comply)
- Recommended best practices
- Deviations acceptable with reason

## Deviation Process

For any violations that cannot be fixed:

1. Document the rule violated
2. Explain why compliance is impractical
3. Describe mitigation measures
4. Get formal approval from safety manager
5. Add suppression comment in code:
   \`\`\`c
   /* MISRA Deviation: Rule X.Y - Justification */
   // cppcheck-suppress misra-c2012-X.Y
   code_here();
   \`\`\`

## References

- [MISRA C:2012](https://www.misra.org.uk/misra-c/)
- [Cppcheck MISRA](https://cppcheck.sourceforge.io/misra.php)
- [Embedded C Coding Standard](https://barrgroup.com/embedded-systems/books/embedded-c-coding-standard)

EOF

echo ""
echo "Full compliance report: $REPORT_DIR/compliance_report.md"
echo ""

# Exit with appropriate code
if [ "$MANDATORY_VIOLATIONS" -eq 0 ] && [ "$REQUIRED_VIOLATIONS" -eq 0 ]; then
    exit 0
else
    exit 1
fi
