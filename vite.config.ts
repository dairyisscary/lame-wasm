import { resolve } from "node:path";

import { defineConfig, searchForWorkspaceRoot } from "vite";

const LAME_LIB_DIR = resolve(process.env.LAME_WASM_BRIDGE!, "lib");

export default defineConfig({
  resolve: {
    alias: {
      "@lame-wasm": LAME_LIB_DIR,
    },
    tsconfigPaths: true,
  },
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), LAME_LIB_DIR],
    },
    strictPort: true,
  },
});
