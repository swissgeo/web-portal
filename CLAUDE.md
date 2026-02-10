# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web POC Portal is a Nuxt 4-based geospatial web application by Swissgeo for displaying and managing maps and layers. It uses OpenLayers for mapping with OGC (WMS/WMTS) layer support.

## Common Commands

```bash
# Install dependencies
pnpm install

# Development - run both together in separate terminals
pnpm build:dev:watch   # Watch-build all library packages
pnpm dev               # Start Nuxt dev server at localhost:3000

# Build
pnpm build             # Build all packages
pnpm build-libs        # Build only library packages (excludes main)

# Clean
pnpm clean             # Remove all build outputs (dist/, .nuxt/, .output/)

# Code quality
pnpm lint              # ESLint with auto-fix (all packages)

# Per-package commands (run from package directory)
pnpm run type-check    # TypeScript type checking
pnpm run lint:no-fix   # ESLint without auto-fix
pnpm run format        # Prettier format
pnpm run format:check  # Check formatting
```

## Architecture

### Monorepo Structure (pnpm workspaces)

```
packages/
├── main/        # Nuxt app - entry point, pages, server API
├── map/         # @swissgeo/map - OpenLayers map component
├── layers/      # @swissgeo/layers - Layer management (WMS, WMTS, GeoJSON, Vector Tiles)
├── shared/      # @swissgeo/shared - Types, globals, utilities
├── skeleton/    # @swissgeo/skeleton - UI components (sidebar, layer cart)
├── search/      # @swissgeo/search - Search functionality
└── content/     # @swissgeo/content - Content rendering
ogc-records/     # OGC catalog data (collections, styles, services)
```

### Dependency Flow

```
main (Nuxt App)
├── @swissgeo/map
│   ├── @swissgeo/layers
│   └── @swissgeo/shared
├── @swissgeo/skeleton
│   ├── @swissgeo/layers
│   ├── @swissgeo/content
│   ├── @swissgeo/search
│   └── @swissgeo/shared
└── @swissgeo/shared
```

### Key Technologies

- **Framework**: Nuxt 4 / Vue 3 / Vite
- **State**: Pinia
- **UI**: PrimeVue + Tailwind CSS
- **Maps**: OpenLayers + ol-mapbox-style
- **i18n**: Vue-i18n (German/French, no-prefix strategy)
- **Package Manager**: pnpm 10.14.0

### Server API Structure

API endpoints in `packages/main/server/api/v1/layers/`:
- `swissgeo/catalog` - OGC catalog
- `swissgeo/collections/[distributionId]` - Layer distributions
- `swissgeo/items/[datasetId]` - Dataset items
- `swissgeo/styles/[styleId]` - Style definitions
- `wmsConfig/[capabilityUrl]` - WMS capabilities
- `wmtsConfig/[capabilityUrl]` - WMTS capabilities
- `external/service/[capabilityUrl]` - External OGC services

### Entry Points

- Main app: `packages/main/app/pages/map.vue` - primary map interface
- Map component: `packages/map/src/index.ts` exports `MapModule`
- Layer stores: `packages/layers/src/stores/` - layer state management
- Each library exports from `src/index.ts`

### Configuration

- TypeScript extends `@swissgeo/config-typescript/tsconfig.base.json`
- ESLint extends `@swissgeo/config-eslint` (flat config)
- Auto-imports enabled for Vue, Pinia, Vue Router, Vue i18n
- Type checking disabled in Nuxt config (use `pnpm run type-check` manually)
