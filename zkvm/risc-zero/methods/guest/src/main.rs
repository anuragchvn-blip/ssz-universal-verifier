#![no_main]
#![no_std]

use risc0_zkvm::guest::env;

risc0_zkvm::guest::entry!(main);

fn main() {
    let input: u32 = env::read();
    let output = input.wrapping_mul(2);
    env::commit(&output);
}
