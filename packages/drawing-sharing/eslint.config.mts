import defaultConfig from "@swissgeo/config-eslint";

import { globalIgnores } from "eslint/config";

export default [
  ...defaultConfig,
  globalIgnores([".nuxt", ".output", "node_modules", "src/hey-api/*"]),
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
