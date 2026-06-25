# lame-wasm

[LAME][lame] compiled into freestanding WASM with a TypeScript/JavaScript bridge API.

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
    sampleRate: 48_000, // Perhaps from a `new AudioContext().sampleRate`...
    kilobitRate: 128,
  });

  const chunks = [];
  chunks.push(lame.encodeFloat(pcmData));
  chunks.push(lame.flush()); // finish with a flush

  const mp3 = new Blob(chunks, { type: "audio/mp3" });
}
```

## License

`lame-wasm` itself is licensed under the MIT license, while the `LAME` library is licensed under
the [Library General Public License V2][gpl2]. `lame-wasm` contains no source code nor
modifications of `LAME`, but its compiled, distributed form in the NPM registry is comprised of
portions of `LAME` object code.

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

[lame]: https://lame.sourceforge.io/
[gpl2]: https://www.gnu.org/licenses/old-licenses/lgpl-2.0.html
