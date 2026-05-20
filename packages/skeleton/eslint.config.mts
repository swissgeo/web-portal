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
    rules: {
      // Prettier owns HTML indentation; this rule conflicts with Prettier's
      // closing-bracket style for multi-line tags and is already disabled by
      // @vue/eslint-config-prettier/skip-formatting in the shared config,
      // but the shared config re-enables it afterwards.
      "vue/html-indent": "off",
    },
  },
];
