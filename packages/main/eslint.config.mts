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
          // The list below is past typescript-eslint's default cap of 8.
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 16,
          allowDefaultProject: [
            "server/utils/__tests__/*.ts",
            "server/routes/__tests__/*.ts",
            "server/api/wpa/v1/content/__tests__/*.ts",
            "server/api/wpa/v1/elevation/__tests__/*.ts",
            "server/api/wpa/v1/layers/external/dataset/?capabilityUrl?/__tests__/*.ts",
            "server/api/wpa/v1/layers/external/?capabilityUrl?/__tests__/*.ts",
            "server/api/wpa/v1/layers/external/service/__tests__/*.ts",
            "server/middleware/*.ts",
            "tests/setup.ts",
          ],
        },
      },
    },
  },
];
