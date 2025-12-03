fn main() {
    // Build script - RISC Zero will compile guest code
    println!("cargo:rerun-if-changed=guest/src");
}
