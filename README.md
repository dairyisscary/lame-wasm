# lame-wasm

[LAME](https://lame.sourceforge.io/) compiled into freestanding WASM.

## Installation and Example Usage

```bash
npm install lame-wasm
```

```javascript
import { init } from "lame-wasm";

async function record() {
  // Mono 48kbps PCM input, 128kbps output
  const lame = await init({
    channels: 1,
    sampleRate: 48_000, // Perhaps from a new AudioContext().sampleRate...
    kilobitRate: 128,
  });

  const chunks = [];
  chunks.push(lame.encodeFloat(pcmData));
  chunks.push(lame.flush()); // finish with a flush

  const mp3 = new Blob(chunks, { type: "audio/mp3" });
}
```

## Development

With the `default` Nix shell:

```bash
# Formatting
nix fmt .
oxfmt .

# Linting/typecheck
oxlint
tsc

# Demo development
vite

# Publishing (command order matters)
# Don't forget to update the CHANGELOG
vite build
tsc -p tsconfig.publish.json

pnpm login
pnpm publish --access public
```
