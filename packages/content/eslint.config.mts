import defaultConfig from "@swissgeo/config-eslint";

import { globalIgnores } from "eslint/config"

export default [
  ...defaultConfig,
  globalIgnores([".nuxt"]),
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
