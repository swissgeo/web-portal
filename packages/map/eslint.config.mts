import defaultConfig from "@swissgeo/config-eslint";

import { globalIgnores } from "eslint/config";

export default [
  ...defaultConfig,
  globalIgnores([".nuxt", ".output", "node_modules"]),
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Node dev scripts (e.g. fetch-geoadmin-styles.mjs) run outside the browser.
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        fetch: "readonly",
        console: "readonly",
        process: "readonly",
      },
    },
  },
];
