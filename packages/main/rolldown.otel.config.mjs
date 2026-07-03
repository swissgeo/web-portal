import { defineConfig } from "rolldown";

export default defineConfig({
  input: "server/instrumentation.ts",
  platform: "node",
  transform: {
    target: "es2022",
  },
  output: {
    format: "esm",
    file: ".output/server/instrumentation.mjs",
    sourcemap: true,
    codeSplitting: false,
  },
});
