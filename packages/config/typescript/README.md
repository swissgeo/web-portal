# @swissgeo/config-typescript

Shared TypeScript configuration for SWISSGEO projects.

## Overview

This package provides standardized TypeScript configurations for SWISSGEO projects, with presets for:

- Base TypeScript configuration for modern bundlers (Vite, Webpack, etc.)
- Vue 3 Single File Component (SFC) support

## Installation

```bash
npm install --save-dev @swissgeo/config-typescript typescript
```

## Usage

### Base Configuration

For standard TypeScript projects, extend the base configuration in your `tsconfig.json`:

```json
{
  "extends": "@swissgeo/config-typescript/tsconfig.base.json"
}
```

### Vue 3 Configuration

For Vue 3 projects with SFC support, extend the Vue configuration:

```json
{
  "extends": "@swissgeo/config-typescript/tsconfig.vue.json"
}
```

### Imports inside a package

Don't use a tsconfig `paths` alias such as `@/`. Use Node subpath imports in the
package's `package.json` instead. TypeScript, Vite and Vitest resolve them
without extra config, and they are scoped to the package:

```json
{
  "imports": {
    "#*": "./src/*.ts",
    "#*.vue": "./src/*.vue"
  }
}
```

```ts
import { foo } from "#utils/foo"; // → src/utils/foo.ts
import Bar from "#components/Bar.vue"; // → src/components/Bar.vue
```

Directory imports need an explicit `index`: `#types/index`. Only add the
extra `#*.<ext>` keys (`.vue`, `.css`, `.svg`…) a package actually uses.

## Configuration Details

### Base Configuration (`tsconfig.base.json`)

- **Module System**: ESNext with bundler module resolution
- **JSX**: Preserved with Vue JSX import source
- **Target**: DOM and ESNext features
- **Isolated Modules**: Enabled (required for Vite)
- **ES Module Interop**: Enabled
- **Library Support**: Includes `DOM`, `ESNext`, and `webworker` types

#### Includes

- `env.d.ts`
- `src/**/*.js`
- `src/**/*.ts`
- `src/**/*.json`
- `src/**/*.vue`

#### Excludes

- Markdown files (`**/*.md`)
- `node_modules`
- `dist`
- ESLint config files (`eslint.config.mts`)
- Cypress files and tests (`cypress.config.*`, `tests/cypress/`)

### Vue Configuration (`tsconfig.vue.json`)

Extends the base configuration with Vue-specific settings:

- **Isolated Declarations**: Disabled (Vue compatibility)
- **Includes**: Only `.vue` files

## Optional Type Dependencies

This package includes optional TypeScript definitions for common libraries:

- `@types/geojson`
- `@types/node`

Install only the type definitions you need for your project.

## Path Aliases

The base configuration sets up the `@/*` path alias pointing to the `src` directory. You may need to adjust this in your project's `tsconfig.json` depending on your project structure.

## Peer Dependencies

This package requires:

- `typescript`

## License

BSD-3-Clause

## Repository

[https://github.com/geoadmin/web-mapviewer](https://github.com/geoadmin/web-mapviewer)
