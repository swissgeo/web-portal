# @swissgeo/config-eslint

Shared ESLint configuration for SWISSGEO projects.

## Overview

This package provides a comprehensive ESLint flat config setup for SWISSGEO projects, with built-in support for:

- TypeScript
- Vue 3
- JavaScript (ES6+)
- Markdown files
- Unit tests (Vitest)

## Installation

```bash
npm install --save-dev @swissgeo/config-eslint eslint
```

## Usage

### Basic Configuration

Create an `eslint.config.mts` file in your project root:

```typescript
import eslintConfig from "@swissgeo/config-eslint";

export default eslintConfig;
```

### Granular Configurations

You can also import specific configurations if you don't want the full default set:

- `vueConfig`: Vue 3 specific rules
- `unitTestsConfig`: Rules for `*.spec.{js,ts}` files
- `markdownConfig`: Markdown linting rules
- `jsConfig`: Standard JavaScript rules

```typescript
import { jsConfig, vueConfig } from "@swissgeo/config-eslint";

export default [...jsConfig, ...vueConfig];
```

### Custom Configuration

You can extend or override the default configuration:

```typescript
import eslintConfig from "@swissgeo/config-eslint";

export default [
  ...eslintConfig,
  {
    rules: {
      // Your custom rules
    },
  },
];
```

## Features

### TypeScript Support

- Full TypeScript linting with `@typescript-eslint`
- Consistent type exports enforcement
- No import type side-effects

### Vue 3 Support

- Vue 3 ESLint rules with TypeScript integration
- 4-space HTML indentation
- Alphabetical import sorting

### Import Sorting

Automatic alphabetical import sorting with `eslint-plugin-perfectionist`, treating `@/*` imports as internal.

### Code Style

- Enforced curly braces for all control statements
- Consistent brace style (1tbs)
- No console statements in production code (except tests)

### Test Support

- **Unit Tests**: Rules for `*.spec.{js,ts}` files

### Markdown Linting

Support for linting code blocks in Markdown files.

## Peer Dependencies

This package requires:

- `eslint`
- `@swissgeo/config-prettier`
- `@swissgeo/config-stylelint`

## License

BSD-3-Clause

## Repository

[https://github.com/swissgeo/web-portal](https://github.com/swissgeo/web-portal)
