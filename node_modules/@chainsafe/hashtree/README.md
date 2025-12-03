# @chainsafe/hashtree

Simple NAPI wrapper around https://github.com/prysmaticlabs/hashtree


## Example

```ts
import {hash, hashInto} from "@chainsafe/hashtree"

// input is a Uint8Array of concatenated left-right tuples
const input: Uint8Array = Buffer.concat([
  Buffer.alloc(32), Buffer.alloc(32),
  Buffer.alloc(32, 1), Buffer.alloc(32, 1),
])

// output will be a Uint8Array of concatenated output hashes
const output = hash(input)

// for example, when compared to node:crypto usage:
import {createHash} from "node:crypto"

Buffer.compare(
  createHash("sha256").update(input.slice(0, 64)).digest(),
  output.slice(0, 32)
) === 0
Buffer.compare(
  createHash("sha256").update(input.slice(64)).digest(),
  output.slice(32)
) === 0

// alternative interface with preallocated output
const output2 = new Uint8Array(input.length / 2)
hashInto(input, output2)
```

## License

MIT