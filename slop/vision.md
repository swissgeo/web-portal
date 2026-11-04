# Monorepo setup: Nuxt UI web app

A setup that fits a small Nuxt UI app: **pnpm workspaces, no build step for internal packages, a single build for the app**.

## Layout

```
my-app/
├─ package.json             # private root, orchestration scripts only
├─ pnpm-workspace.yaml      # packages: ['apps/*', 'packages/*']
├─ tsconfig.base.json       # shared compiler options
├─ apps/
│  └─ web/                  # the Nuxt app (extends the ui layer)
└─ packages/
   ├─ ui/                   # Nuxt layer: @nuxt/ui, components, composables, theme
   └─ core/                 # plain TS: domain logic, types, validation (no Vue/Nuxt)
```

There are two kinds of package, and the build, type-check and test setup follows from which kind each one is:

- **Nuxt layers** (`ui`, and later maybe `auth`, `admin`…) are for anything that uses Vue, Nuxt auto-imports or Nuxt UI. The app consumes them with `extends`.
- **Plain TS packages** (`core`) hold framework-free logic. They are the easiest to test and type-check.

## Imports

**Across packages**, use the package name: `import { Invoice } from '@acme/core'`, declared as `"@acme/core": "workspace:*"`.

**Inside a plain TS package**, use Node subpath imports instead of a tsconfig `@/` alias:

```jsonc
// packages/core/package.json
{
  "name": "@acme/core",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },   // consumed as source, no build
  "imports": { "#*": "./src/*.ts" },
  "scripts": { "typecheck": "tsc --noEmit", "test": "vitest run" }
}
```

```ts
import { slugify } from '#utils/slugify'   // → src/utils/slugify.ts
```

This beats `@/` from tsconfig `paths` in a monorepo. A `paths` alias belongs to one tsconfig, so it breaks when the app's Vite compiles the package's source files. `#` imports are resolved from the nearest `package.json`, so they are automatically scoped per package. TS (`moduleResolution: "Bundler"`), Vite and Vitest all understand them with no extra config.

**Inside the Nuxt app**, use Nuxt's built-in `~/` (or `@/`), which points at `apps/web/app/`.

**Inside a Nuxt layer**, don't use `~/`, because it resolves to the *consuming app*. Give the layer a name with `$meta.name` in its config; Nuxt then creates a `#layers/<name>` alias pointing at the layer's root.

```ts
// packages/ui/nuxt.config.ts
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  $meta: { name: 'ui' },            // → import x from '#layers/ui/app/utils/x'
  modules: ['@nuxt/ui'],
  css: [fileURLToPath(new URL('./app/assets/css/main.css', import.meta.url))],
})
```

```jsonc
// packages/ui/package.json
{
  "name": "@acme/ui",
  "private": true,
  "type": "module",
  "main": "./nuxt.config.ts",
  "scripts": {
    "postinstall": "nuxt prepare",
    "typecheck": "nuxt typecheck",
    "test": "vitest run"
  }
}
```

The app then just declares `extends: ['@acme/ui']`.

## Shared TS config

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true
  }
}
```

Plain packages extend this file. Nuxt packages keep the `tsconfig.json` that Nuxt generates, which references `.nuxt/tsconfig.*.json`. Don't hand-merge it with the base file.

## Per-package summary

| | `packages/core` (plain TS) | `packages/ui` (Nuxt layer) | `apps/web` (Nuxt app) |
|---|---|---|---|
| **Build** | None. Exported as `.ts` source. | None. Nuxt reads the layer as source. | `nuxt build` → `.output/`. This is the only real build. |
| **Type-check** | `tsc --noEmit` | `nuxt typecheck` (vue-tsc; needs `nuxt prepare` first, done via `postinstall`) | `nuxt typecheck` (also covers layer and `core` code it imports) |
| **Tests** | `vitest run`, node env, no config needed | `vitest run` with projects: unit + Nuxt env | Same as `ui` |
| **Deps** | `typescript`, `vitest` | `nuxt`, `@nuxt/ui`, `vue-tsc`, `@nuxt/test-utils`, `@vue/test-utils`, `happy-dom` | Same + `@acme/ui`, `@acme/core` |

### Vitest config for the Nuxt packages

```ts
// packages/ui/vitest.config.ts  (same shape in apps/web)
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      { test: { name: 'unit', include: ['test/unit/**/*.test.ts'], environment: 'node' } },
      await defineVitestProject({
        test: { name: 'nuxt', include: ['test/nuxt/**/*.test.ts'], environment: 'nuxt' },
      }),
    ],
  },
})
```

Keep most logic in `core` or in plain functions so it lands in the fast `unit` project. Use the `nuxt` environment (`mountSuspended`, auto-imports, Nuxt UI components) only where you need it. Pick each test file's environment with the projects' `include` globs rather than a `// @vitest-environment` comment, since the comment switches the environment without adding or removing the Nuxt Vite plugins.

## Root scripts

```jsonc
// package.json (root)
{
  "private": true,
  "scripts": {
    "dev": "pnpm --filter web dev",
    "build": "pnpm --filter web build",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test"
  }
}
```

To work on one package, run `pnpm --filter @acme/core test`, or run `vitest` (watch mode) inside its folder. At this size you don't need Turborepo or Nx; `pnpm -r` is enough.

## Gotchas

- **Symlinked workspace packages:** pnpm symlinks them, so their real path is outside `node_modules`. Vite and Nitro therefore compile them like app code. If SSR ever complains about importing a `.ts` file from a package, add it to `build.transpile` in the app's `nuxt.config`.
- **Tailwind classes outside the layer and app:** if you write Tailwind classes in a package that isn't a layer or the app (unusual), add an `@source` line for it in the layer's `main.css` so Tailwind scans it.
- **Keep `core` free of Nuxt/Vue imports.** That's what keeps it testable with zero config, and it's the main payoff of splitting.

## Sources

- [Authoring Nuxt Layers (Nuxt docs)](https://nuxt.com/docs/4.x/guide/going-further/layers)
- [Testing (Nuxt docs)](https://nuxt.com/docs/4.x/getting-started/testing)
