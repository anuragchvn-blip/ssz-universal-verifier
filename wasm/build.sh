#!/bin/bash
# WASM Build Script for SSZ Universal Verifier

set -e

echo "🔧 Building SSZ Verifier WASM..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build for different targets
build_target() {
    TARGET=$1
    echo "📦 Building for target: $TARGET"
    wasm-pack build --target $TARGET --out-dir pkg-$TARGET --release
    
    # Optimize with wasm-opt if available
    if command -v wasm-opt &> /dev/null; then
        echo "⚡ Optimizing with wasm-opt..."
        wasm-opt -Oz pkg-$TARGET/ssz_verifier_wasm_bg.wasm -o pkg-$TARGET/ssz_verifier_wasm_bg.wasm
    fi
    
    echo "✅ Built $TARGET successfully"
}

# Parse arguments
if [ -z "$1" ]; then
    # Default: build for web
    build_target "web"
else
    # Build specified target
    build_target "$1"
fi

# Show size
echo ""
echo "📊 Build size:"
ls -lh pkg-*/ssz_verifier_wasm_bg.wasm

echo ""
echo "✨ WASM build complete!"
echo "📂 Output: wasm/pkg-*/"
