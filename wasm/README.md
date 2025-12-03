# WASM Build Configuration

This directory contains configurations and build scripts for compiling the SSZ Universal Verifier to WebAssembly (WASM).

## Two WASM Build Approaches

### 1. Rust → WASM (Recommended)
**Pros:** Best performance, smallest binary size, `no_std` support
**Use case:** Production deployments, browser-based light clients

### 2. TypeScript → WASM via AssemblyScript
**Pros:** Code reuse from TypeScript implementation
**Use case:** Alternative approach if Rust toolchain unavailable

---

## Rust → WASM Build

### Prerequisites

```bash
# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sh | sh

# Or via cargo
cargo install wasm-pack

# Install wasm-opt (optional, for optimization)
npm install -g wasm-opt
```

### Quick Start

```bash
# Build for web (includes JS bindings)
npm run build:wasm

# Build for Node.js
npm run build:wasm:node

# Build for bundlers (webpack, rollup)
npm run build:wasm:bundler

# Build with optimizations
npm run build:wasm:release
```

### Build Targets

- **`web`**: For direct browser usage with ES modules
- **`nodejs`**: For Node.js environments
- **`bundler`**: For webpack/rollup/parcel
- **`no-modules`**: For legacy browsers without ES modules

### Output Structure

```
wasm/pkg/
├── ssz_verifier_wasm.js       # JS bindings
├── ssz_verifier_wasm.d.ts     # TypeScript definitions
├── ssz_verifier_wasm_bg.wasm  # WASM binary
├── package.json               # npm package metadata
└── README.md                  # Usage instructions
```

---

## TypeScript → AssemblyScript (Alternative)

### Prerequisites

```bash
npm install --save-dev assemblyscript
```

### Build

```bash
npm run build:asc
```

---

## Browser Usage

### ES Modules (Modern Browsers)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>SSZ Verifier WASM</title>
</head>
<body>
    <script type="module">
        import init, { sszStreamRoot } from './wasm/pkg/ssz_verifier_wasm.js';
        
        async function run() {
            await init();
            
            // Example: Verify uint64
            const data = new Uint8Array([42, 0, 0, 0, 0, 0, 0, 0]);
            const typeDesc = { type: 'uint64' };
            const root = sszStreamRoot(data, typeDesc);
            
            console.log('Root:', Array.from(root).map(b => 
                b.toString(16).padStart(2, '0')).join(''));
        }
        
        run();
    </script>
</body>
</html>
```

### Using with Bundlers (webpack, Vite, etc.)

```javascript
import init, { sszStreamRoot } from 'ssz-verifier-wasm';

await init();

const data = new Uint8Array([...]);
const root = sszStreamRoot(data, { type: 'uint64' });
```

---

## Node.js Usage

```javascript
const { sszStreamRoot } = require('./wasm/pkg/ssz_verifier_wasm.js');

const data = Buffer.from([42, 0, 0, 0, 0, 0, 0, 0]);
const typeDesc = { type: 'uint64' };
const root = sszStreamRoot(data, typeDesc);

console.log('Root:', root.toString('hex'));
```

---

## Performance

**Expected WASM performance:**
- **Binary size:** ~50-100KB (optimized with wasm-opt)
- **Load time:** <100ms on modern connections
- **Execution:** Near-native speed (95-98% of native Rust)

**Optimization flags:**
- `opt-level = "z"`: Optimize for size
- `lto = true`: Link-time optimization
- `wasm-opt -Oz`: Aggressive size optimization

---

## Testing WASM Build

```bash
# Run WASM tests
npm run test:wasm

# Run in browser
npm run serve:wasm
```

---

## Deployment

### NPM Package

```bash
cd wasm/pkg
npm publish
```

### CDN Usage (unpkg, jsDelivr)

```html
<script type="module">
    import init from 'https://unpkg.com/ssz-verifier-wasm/ssz_verifier_wasm.js';
    await init();
</script>
```

---

## Troubleshooting

### "RuntimeError: memory access out of bounds"
- Check input data size matches type descriptor
- Verify no buffer overflows in streaming code

### "Module not found" errors
- Ensure wasm-pack generated `pkg/` directory
- Check import paths match build target

### Large binary size
- Run wasm-opt: `wasm-opt -Oz input.wasm -o output.wasm`
- Enable LTO in Cargo.toml
- Use `opt-level = "z"` instead of `3`

### Slow initialization
- Use `WebAssembly.instantiateStreaming()` for parallel download+compile
- Consider caching compiled module in IndexedDB

---

## Size Budget

**Target sizes:**
- Unoptimized: ~200KB
- Optimized (`wasm-opt -O3`): ~80KB
- Aggressively optimized (`wasm-opt -Oz`): ~50KB
- Gzipped: ~20KB

---

## Security Considerations

1. **No eval or dynamic code**: WASM is fully sandboxed
2. **Memory safety**: Rust's safety guarantees preserved
3. **Deterministic execution**: Same as native versions
4. **No network access**: WASM has no I/O by default

---

## Browser Compatibility

**Minimum versions:**
- Chrome/Edge: 57+
- Firefox: 52+
- Safari: 11+
- Opera: 44+

**Feature detection:**

```javascript
if (typeof WebAssembly === 'object') {
    // WASM supported
} else {
    // Fallback to JavaScript implementation
}
```

---

## Advanced Configuration

### Custom Memory Allocation

```rust
#[cfg(target_arch = "wasm32")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
```

### Debugging WASM

```bash
# Build with debug info
wasm-pack build --dev

# Use browser DevTools
# Chrome: chrome://inspect
# Firefox: about:debugging
```

---

## Next Steps

1. Build WASM binary: `npm run build:wasm`
2. Test in browser: `npm run serve:wasm`
3. Benchmark performance: `npm run bench:wasm`
4. Publish to npm: `cd wasm/pkg && npm publish`
