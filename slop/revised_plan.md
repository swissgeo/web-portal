# Plan: library packages consumed as source

## Goal

Move from built library packages (vite/rolldown builds to `dist/`, orchestrated by turbo) to packages that the Nuxt app consumes as source:

- Each package exports `src/*.ts`; nothing builds except the app (and tooling packages that ESLint/Prettier load at runtime).
- Packages use Node subpath imports (`#…`) instead of a tsconfig `@/` alias.
- The app compiles the packages with its own Vite and type-checks them with its own tsconfig.
- The folder layout stays as is (the app remains in `packages/main`).

## Package groups

- **Plain TS:** numbers, log, ogc, feature, layers, statesharing, drawing-sharing.
- **Vue SFCs, no Nuxt:** map, elevation-profile, coordinates, drawing.
- **Effectively Nuxt layers:** dimension, content, skeleton (Nuxt UI components and/or app configuration).
- **Tooling, keeps building:** `config/eslint`, `config/prettier` (loaded by ESLint/Prettier from `dist`).

## Principles

- **Prepare while the builds still exist, switch in one go.** Everything that can be done with the builds in place is done first, in small PRs. The switch itself then changes all packages at once. A mixed state, where packages that still build depend on packages already consumed as source, needs temporary build workarounds (externals, type bundling) and is not worth it.
- **Check what the app actually loads, not only what it type-checks.** Consuming source means the app now runs the packages' own imports: CSS imports, deep and barrel imports of dependencies, and the packages' dependency declarations.
- **Behavior-preserving fixes.** Type fixes narrow, guard or make types precise. Places that would change runtime behavior are listed in the PR description for review.
- **Each PR is verified the same way** (see "Verification").

## Steps

### 1. Inventory

No code changes. Produces the checklist for steps 3 and 5.

- **Compiler options:** diff the app's generated tsconfig (`packages/main/.nuxt/tsconfig.app.json`) against the packages' shared base. Every strictness flag the app has and the packages don't (e.g. `strictNullChecks`, `noUncheckedIndexedAccess`, `noImplicitOverride`) will apply to package source once the app compiles it. Count the errors per package with these flags on, split into source and test files (the app never imports package tests).
- **Runtime imports of each package's source:**
  - CSS imported from `src/` (not only the `./stylesheet` export), and in particular any `@import "tailwindcss"`.
  - `<style>` blocks using `@apply` (they need `@reference` once the app compiles them).
  - Which packages use Tailwind classes, compared to the `@source` lines in the app's `main.css`.
  - Imports of the package's own name (self-imports).
  - Bare imports that aren't declared in `dependencies`/`peerDependencies` (only resolving through the root `package.json` or auto-installed peers).
  - Barrel imports (e.g. `ol/source`) and modules that fail when loaded in Node or in a worker thread (e.g. `ol/source/GeoTIFF` → `geotiff` → `web-worker`). The app's SSR loads every module that a server-rendered component, store or composable imports, even when the component itself is rendered only on the client.
- **Hidden framework coupling:** globals the packages expect from Nuxt (`useRuntimeConfig`, auto-imports, globally registered components) and ambient type files (`declare global`, `declare module`) that only the package's own tsconfig includes.
- **CI and deployment usage of scripts:** the CodeBuild specs (`infra-terraform/aws/swisstopo-swissgeo-builder/shared/codebuild-projects/web-portal/`) and the Dockerfile. Note every root script they call.

### 2. Subpath imports instead of `@/`

- Per package: `"imports": { "#*": "./src/*.ts" }`, plus `"#*.vue"`, `"#*.css"`, `"#*.svg"` keys only where used. Imports stay extensionless; directory imports become `#dir/index`.
- Remove the `@/` aliases from vite/vitest configs and the tsconfig `paths` (per package and in the shared base).
- ESLint import sorting: treat `^#.*` as internal (perfectionist's own default).
- While packages still emit per-file `.d.ts`, `unplugin-dts` needs an alias that rewrites `#…` to relative paths in the emitted types. Without it, consumers resolve the types through the `imports` field to `src/*.ts`. The alias is temporary and goes away with the builds.
- Can be one PR for all packages; it's a mechanical rewrite.

### 3. Match the app's compiler strictness

- Turn on `strictNullChecks` in the shared base and fix all errors (source and tests). Packages that the app consumes see their emitted types become precise (`| null`/`| undefined` kept), so fix the app's code that relied on the looser types in the same PR.
- Fix the package **source** errors from the app's other flags (`noUncheckedIndexedAccess`, `noImplicitOverride`). Prefer typed destructures, `?.`/`??` where equivalent, narrowing on local constants, and `!` with a comment only where an invariant guarantees the value (mandatory regex groups, length checks, loop bounds, `[x, y]` coordinates).
- Make types reflect invariants the code already relies on instead of asserting them repeatedly (e.g. required `bounds` on coordinate systems; export types like `TextSize` instead of `keyof typeof …` casts).
- Optional, separate: turning the extra flags on in the shared base too (needs the test errors fixed as well).

### 4. Remove hidden framework coupling and unexported ambient types

- Replace Nuxt globals in packages with explicit inputs, e.g. an exported `InjectionKey` + config type that the app provides from a plugin (`nuxtApp.vueApp.provide(...)`); Pinia setup stores can `inject()` app-level provides. Cover the app side with a Nuxt-environment test that creates the real store.
- Ambient declarations must be part of the import graph:
  - module augmentations (e.g. `declare module "chart.js"`) go into the module that defines the augmented options;
  - untyped dependencies get a small typed wrapper module instead of an ambient `declare module`;
  - unused globals are removed.

### 5. Prepare the packages for source consumption (builds still in place)

Everything from the inventory that doesn't need the switch, as small independent PRs:

- **CSS:**
  - no Tailwind import inside packages;
  - an `@source` line in the app's `main.css` for every package with Tailwind classes;
  - `@reference "tailwindcss"` in `<style>` blocks that use `@apply`;
  - a package's CSS that the app needs is imported by the package's own entry (e.g. `ol/ol.css`), so the app's `@import` of the package's `./stylesheet` export can go away in step 6.
- **Imports:**
  - self-imports become `#` imports;
  - barrel imports that pull in server-incompatible modules become direct imports;
  - modules that can't load on the server are imported lazily where they're used (e.g. `await import("ol/source/GeoTIFF")` when a COG layer is created).
- **Dependency declarations:** framework singletons (`vue`, `pinia`, `ol`, …) as `peerDependencies`, everything else the source imports at runtime as `dependencies`.
- **Configs:**
  - test configuration lives in `vitest.config.ts`, not inside a `vite.config.ts` that will be deleted;
  - demo apps keep a small `vite.config.ts` without the library build.

### 6. Switch all packages to source

One PR, all packages at once:

- `exports` point at source (`".": "./src/index.ts"` plus existing subpaths); remove `files`/`main`/`module`/`types`.
- Delete the vite/rolldown library configs, `dist/`, the `build*`/`prepare`/declaration-only scripts and the build-only devDependencies (`rolldown`, `rolldown-plugin-dts`, `unplugin-dts`, `@microsoft/api-extractor`); drop the `./stylesheet` exports and the app's `@import`s of them.
- Packages type-check other packages' source now: run every package's own type-check, not only the app's.
- A small script that rewrites a package's manifest (exports, scripts, devDependencies, tsconfig `include`) keeps this mechanical and reviewable.

### 7. Clean up

- Remove turbo (configs, dependency, catalog entry, `.gitignore` entry, README section) and helpers that only served the library builds (shared base Vite config, the temporary `unplugin-dts` alias, `rootDir` entries that only existed for them).
- Remove the build tools from the catalog and from renovate rules.
- Root scripts:
  - keep every script that CI or the Dockerfile calls (from the inventory);
  - `build:dev` stays recursive as long as the tooling packages must be built for lint/format in the CI image;
  - scripts that CI still calls but that have nothing left to do become a no-op `echo` explaining why, and are deleted after the CI spec is updated (separate change in `infra-terraform`);
  - scripts that are unused or broken are removed.
- Update the README (no package build or watch step).

### 8. Later, separately

- **Keep OpenLayers out of SSR:**
  - server-rendered components, stores and composables in the app must not import the OL-based packages (`map`, `drawing`, `elevation-profile`, `ol/*`);
  - use `.client.vue` or lazy components, and stores/composables that don't touch them on the server.
- **Nuxt layers:** turn dimension, content and skeleton into Nuxt layers (`$meta.name`, `#layers/<name>` imports, `extends` in the app). This also replaces the app plugin that registers Nuxt UI components globally for skeleton.
- **One root `prettier --check .`** instead of identical per-package `format` scripts (needs `.prettierignore` entries for root-level files).
- **One root vitest run with `projects`** instead of parallel per-package runs (also avoids races on vitest's shared module cache, which is cleared when the lockfile changes).
- Optionally move the app to `apps/web` and add a shared root `tsconfig.base.json`.

## Verification (every PR)

- `pnpm install --frozen-lockfile`.
- Format, lint, type-check (all packages and the app), unit tests.
- The app's production build, and the root `build:dev` / `build:prod` that the Dockerfile runs.
- From step 5 on:
  - start the dev server and request the main pages (server-side rendering, e.g. `/`, `/de/`, `/de/map`);
  - run the Playwright suite;
  - run `playwright.config.ci.ts` against a production build started like the CI `checker` image (`node .output/server/index.mjs` with `.env.test`).
- Steps 5 and 6: look at the PR preview in a browser. Type-checks, unit tests and Playwright don't catch styling regressions.
- Known noise, not regressions:
  - Playwright's first test per spec file can time out on a cold dev server and pass on retry;
  - the first unit-test run after a lockfile change can fail with `ENOTEMPTY` on `node_modules/.vitest-cache`.

## PRs

| PR  | Content                                                                   | Risk                                       |
| --- | ------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | Step 2: subpath imports                                                   | low, mechanical                            |
| 2   | Step 3: compiler strictness                                               | low–medium (review the behavior changes)   |
| 3   | Step 4: framework coupling, ambient types                                 | low                                        |
| 4   | Step 5: preparation, possibly split by topic (CSS, imports, dependencies) | medium, small independent changes          |
| 5   | Step 6: switch to source                                                  | highest (preview QA, CI Playwright config) |
| 6   | Step 7: cleanup                                                           | low                                        |
| 7   | `infra-terraform`: drop calls to no-op scripts; then remove them here     | low                                        |

Step 1 (inventory) has no PR; its findings go into the descriptions of PRs 2–5.
