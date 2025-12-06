#!/bin/bash
# Performance optimization script for production builds

set -e

echo "🚀 Optimizing SSZ Universal Verifier for Production"
echo ""

# TypeScript Optimizations
echo "📦 Optimizing TypeScript build..."
npm run build
echo "✅ TypeScript optimized"
echo ""

# Rust Release Build with Optimizations
echo "⚙️  Building optimized Rust release..."
cd rust-skel
RUSTFLAGS="-C target-cpu=native -C opt-level=3 -C lto=fat -C embed-bitcode=yes" \
  cargo build --release
cd ..
echo "✅ Rust optimized"
echo ""

# C Optimizations
echo "🔧 Building optimized C implementation..."
cd c-skel
make clean
CFLAGS="-O3 -march=native -flto -fomit-frame-pointer" make all
cd ..
echo "✅ C optimized"
echo ""

# WASM Optimizations
echo "🌐 Building optimized WASM..."
cd wasm
RUSTFLAGS="-C opt-level=z -C lto=fat" npm run build
# Additional wasm-opt if available
if command -v wasm-opt &> /dev/null; then
    echo "Running wasm-opt..."
    wasm-opt -Oz pkg/ssz_verifier_bg.wasm -o pkg/ssz_verifier_bg.wasm
    echo "✅ WASM size optimized"
fi
cd ..
echo ""

echo "✨ Optimization complete!"
echo ""
echo "📊 Build sizes:"
du -sh dist/ rust-skel/target/release/ c-skel/*.a wasm/pkg/*.wasm 2>/dev/null || true
