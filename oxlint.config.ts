import { defineConfig } from "oxlint";

export default defineConfig({
  options: {
    typeAware: true,
  },
  rules: {
    "no-console": "error",
    "prefer-const": "error",
  },
});
