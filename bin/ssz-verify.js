#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { sszStreamRootFromSlice, TypeKind, SszError } = require('../dist/src/index.js');

const args = process.argv.slice(2);
let filePath = '';
let typePath = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file') filePath = args[i + 1];
  if (args[i] === '--type') typePath = args[i + 1];
}

if (!filePath || !typePath) {
  console.error('Usage: ssz-verify --file <path> --type <type.json>');
  process.exit(1);
}

try {
  const fileBuf = fs.readFileSync(filePath);
  const typeJson = JSON.parse(fs.readFileSync(typePath, 'utf8'));
  
  // Convert JSON type desc to internal TypeDesc if needed
  // For simplicity, assume JSON matches TypeDesc structure but with string enums if needed
  // Here we assume raw JSON matches or user provides correct numeric enums
  
  const result = sszStreamRootFromSlice(typeJson, new Uint8Array(fileBuf));
  
  if (result.root) {
    console.log(Buffer.from(result.root).toString('hex'));
    process.exit(0);
  } else {
    console.error(`Error ${result.error}: ${result.msg}`);
    process.exit(1);
  }
} catch (e) {
  console.error('Execution error:', e.message);
  process.exit(1);
}
