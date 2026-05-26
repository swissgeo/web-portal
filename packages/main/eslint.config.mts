import defaultConfig from "@swissgeo/config-eslint";

import { globalIgnores } from "eslint/config";

export default [
  ...defaultConfig,
  globalIgnores([".nuxt", ".output", "node_modules/*"]),
  {
    rules: {
      "vue/multi-word-component-names": ["off"],
      "vue/html-indent": ["off"], // let this be prettier's realm
    },
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        // Server routes and utils are not included in the Nuxt-generated tsconfig,
        // so we allow them to be linted with a default project.
        projectService: {
          allowDefaultProject: [
            "nuxt.config.ts",
            "server/utils/__tests__/*.ts",
            "server/routes/__tests__/*.ts",
            "server/api/wpa/v1/layers/external/dataset/?capabilityUrl?/__tests__/*.ts",
            "server/middleware/*.ts",
            "tests/setup.ts",
          ],
        },
      },
    },
  },
];
