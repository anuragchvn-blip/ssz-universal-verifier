const fs = require('fs');
const { sszStreamRootFromSlice, TypeKind } = require('./dist/src/index.js');

// Create a list of 1000 uint64s (values 0 to 999)
const count = 1000;
const buffer = new Uint8Array(count * 8);
const view = new DataView(buffer.buffer);
for (let i = 0; i < count; i++) {
  view.setBigUint64(i * 8, BigInt(i), true); // Little-endian
}

fs.writeFileSync('dataset.bin', buffer);

// Create the type definition
const typeDesc = {
  kind: TypeKind.List,
  elementType: { kind: TypeKind.Basic, fixedSize: 8 },
  limit: 10000 // Arbitrary high limit
};
fs.writeFileSync('dataset_type.json', JSON.stringify(typeDesc, null, 2));

// Calculate expected root using the library directly
const res = sszStreamRootFromSlice(typeDesc, buffer);
if (res.root) {
  console.log('Expected Root:', Buffer.from(res.root).toString('hex'));
} else {
  console.error('Error calculating root:', res.msg);
}
