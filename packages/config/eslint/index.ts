import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";

import jsESLint from "@eslint/js";
import markdown from "@eslint/markdown";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from "@vue/eslint-config-typescript";
import pluginImport from "eslint-plugin-import";
import mocha from "eslint-plugin-mocha";
import perfectionist from "eslint-plugin-perfectionist";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import tsESLint from "typescript-eslint";

type PartialRules = Partial<Record<string, FlatConfig.RuleEntry>>;

const commonTsAndJsRules: PartialRules = {
  eqeqeq: ["error", "always"],
  "no-console": "error",
  "no-var": "error",
  // Enforce a consistent brace style for all control statements
  curly: ["error", "all"],
  // Enforce opening braces on the same line and closing brace on a new line
  "brace-style": ["error", "1tbs", { allowSingleLine: false }],
  "perfectionist/sort-imports": [
    "error",
    {
      type: "alphabetical",
      internalPattern: ["^@/.*"],
    },
  ],
  "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
  // has some issue (with typescript-eslint for instance), so we disable it (TS does already a good job at detecting unresolved imports)
  "import/no-unresolved": "off",
  "no-useless-assignment": "off",
};

const noUnusedVarsRules: PartialRules = {
  "no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
      destructuredArrayIgnorePattern: "^_",
    },
  ],
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
      destructuredArrayIgnorePattern: "^_",
    },
  ],
};

const standardTSRules: PartialRules = {
  "no-unused-vars": "off",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      // as we are adding dispatcher reference in all our store action, but won't be using
      // them directly in the action, we must ignore these unused variables too
      argsIgnorePattern: "^(_|dispatcher)",
      caughtErrorsIgnorePattern: "^_",
      destructuredArrayIgnorePattern: "^_",
    },
  ],
  "@typescript-eslint/consistent-type-exports": "error",
  "@typescript-eslint/no-import-type-side-effects": "error",
  "@typescript-eslint/consistent-type-imports": [
    "error",
    {
      prefer: "type-imports",
      fixStyle: "separate-type-imports",
    },
  ],
  // TODO: re-enable these rules and fix violations in a separate PR
  // '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  // '@typescript-eslint/no-base-to-string': 'error',
  "@typescript-eslint/no-unnecessary-type-assertion": "off",
  "@typescript-eslint/no-base-to-string": "off",
};

const allIgnores: string[] = [
  ".gitignore",
  "**/node_modules",
  "**/.github",
  "**/dist",
  "tsconfig.json",
  "**/*.md",
  "**/eslint.config.mts",
];

export const vueConfig: FlatConfig.ConfigArray = defineConfigWithVueTs(
  pluginImport.flatConfigs.recommended,
  pluginImport.flatConfigs.typescript,
  pluginVue.configs["flat/essential"],
  tsESLint.configs.recommended,
  vueTsConfigs.recommendedTypeCheckedOnly,
  {
    files: ["**/*.vue"],
    plugins: {
      perfectionist,
    },
    rules: {
      ...commonTsAndJsRules,
      "vue/block-lang": "error",
      ...noUnusedVarsRules,
    },
  },
);

export const unitTestsConfig: FlatConfig.ConfigArray = [
  {
    files: ["**/*.spec.{js,ts}", "scripts/**.{js,ts}"],
    rules: {
      "no-console": "off",
      "no-prototype-builtins": "off",
      ...noUnusedVarsRules,
    },
  },
];

export const markdownConfig: FlatConfig.ConfigArray = [
  {
    files: ["**/*.md"],
    plugins: {
      markdown: markdown,
    },
    processor: "markdown/markdown",
    rules: {
      "no-irregular-whitespace": "off",
      "no-undef": "off",
    },
  },
];

export const jsConfig: FlatConfig.ConfigArray = [
  jsESLint.configs.recommended,
  {
    ignores: allIgnores,
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    // no need to check our snippets
    ignores: ["**/*.md"],
    plugins: {
      mocha,
      perfectionist,
    },
    languageOptions: {
      ecmaVersion: "latest",

      globals: {
        ...globals.browser,
        ...globals.vitest,
        ...globals.node,
        defineModel: "readonly",
      },

      sourceType: "module",
    },
    rules: {
      ...commonTsAndJsRules,
      "mocha/no-exclusive-tests": "error",
      ...noUnusedVarsRules,
    },
  },
  ...markdownConfig,
  ...unitTestsConfig,
  ...vueConfig,
  // skip the formatting in the linting process
  skipFormatting,
];

const defaultConfig: FlatConfig.ConfigArray = tsESLint.config(
  pluginImport.flatConfigs.recommended,
  pluginImport.flatConfigs.typescript,
  ...jsConfig,
  tsESLint.configs.recommended,
  ...markdownConfig,
  ...vueConfig,
  {
    ignores: allIgnores,
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    // no need to check our snippets
    ignores: ["**/*.md"],
    plugins: {
      perfectionist,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    // switching to TypeScript unused var rule (instead of JS rule), so that no error is raised
    // on unused param from abstract function arguments
    rules: {
      ...standardTSRules,
      ...commonTsAndJsRules,
    },
  },
  // we have to declare that AFTER the TS specifics, our unit test rules from the JS config are otherwise ignored (when the tests are written in TS)
  unitTestsConfig,
  {
    files: ["rolldown.config.*"],
    rules: {
      "import/no-unresolved": "off",
    },
  },
);

export default defaultConfig;
