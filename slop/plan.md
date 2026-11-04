# Plan: incremental steps towards `vision.md`

Goal: move from built libraries (vite/rolldown + dts → `dist/`, orchestrated by turbo) to packages consumed as source, as described in `vision.md`. The app stays in `packages/main`; no folder moves for now.

## Package groups

- **Plain TS:** numbers, log, ogc, feature, layers, statesharing, drawing-sharing
- **Vue SFCs, no Nuxt:** map, elevation-profile, coordinates, drawing. Not covered by `vision.md`; keep `vue-tsc` + vitest with `@vitejs/plugin-vue`.
- **Effectively Nuxt layers:** dimension, content, skeleton (they use `<U*>` Nuxt UI components and/or `useRuntimeConfig`)

## Steps

Steps 1–3 are preparation that is safe while the builds still exist. Step 4 is the first change in how things actually behave. Do each step one package per PR, leaf packages first (numbers, log, then shared…).

### 1. Replace `@/` aliases with `#` subpath imports

About 170 files across 13 packages import via `@/`. Once main's Vite compiles package source, `@/` resolves to `packages/main/app/` and the package breaks.

- Add `"imports": { "#*": "./src/*" }` to the package's `package.json`.
- Rewrite `@/...` imports to `#...`.
- Remove the alias from `vite.config.ts`, `vitest.config.ts` and the tsconfig `paths`.
- Special cases:
  - `packages/map/tsconfig.json` maps `@/*` and `@stores/*` to `../skeleton/src/*` as well. Remove that cross-package reach.
  - skeleton also defines `~`, which clashes with Nuxt's `~`.
- When all packages are done, remove `paths` from `packages/config/typescript/tsconfig.base.json`.

### 2. Turn on `strictNullChecks` per package

`packages/config/typescript/tsconfig.base.json` sets `strictNullChecks: false`, while main is `strict: true`. Once main imports package source, `nuxt typecheck` checks that source with main's (strict) options.

- Override `strictNullChecks: true` in each package's tsconfig and fix the errors.
- When every package has it, drop the setting from the shared base.

### 3. Remove the hidden Nuxt coupling and the unexported ambient types

- `skeleton/types/index.d.ts` declares a global `useRuntimeConfig`, which would conflict with Nuxt's real auto-import type. `content/src/stores/menu.ts` has a local `useRuntimeConfig` shim. Pass the config into these stores (parameter or injection) instead.
- `map/env.d.ts` and `layers/env.d.ts` (`Window.map` global, `declare module "reproject"`) are only seen by the package's own tsconfig. Move them into files that `src` imports, or into a types entry the package exports, so main sees them too.

### 4. Switch `exports` to source, one leaf package at a time

- Set `"exports": { ".": "./src/index.ts" }` (plus any subpaths, e.g. `shared/language`, `log/Message`, `coordinates/ol`).
- Delete the build scripts (`build`, `build:dev`, `build:dev:watch`, `build:prod`, `build:int`, `prepare` in log) and the `vite.config.ts` / `rolldown.config.ts`. Keep a vitest config if tests need one.
- For map and dimension: remove the `./stylesheet` export and its `@import` in `packages/main/app/assets/css/main.css`. SFC styles now arrive with the source. Check `elevation-profile/src/style.css` is imported from its source.
- Verify in main: `nuxt dev`, `nuxt build`, `nuxt typecheck`, unit tests.
- If SSR complains about importing `.ts` from a package, add it to `build.transpile` in `packages/main/nuxt.config.ts`.
- Turbo copes with a mix: `^build` skips packages that have no build script.

### 5. Clean up once nothing builds

- Remove turbo (`turbo.json`, `packages/main/turbo.json`, the dependency, `clean:turbo`).
- Remove `base.vite.config.ts`, `unplugin-dts`, `rolldown-plugin-dts`, `@microsoft/api-extractor` if unused, and the `build-libs*` / `build:dev:watch` root scripts.
- Root scripts become simple `pnpm --filter main …` / `pnpm -r …`, as in `vision.md`.
- Check the Dockerfile still works (`pnpm run build:prod` should now just build main).

### 6. Later, separately

- Turn dimension, content and skeleton into Nuxt layers (`$meta.name`, `#layers/<name>` imports, `extends` in main).
- Optionally move to `apps/web` + `packages/*` and add the shared root `tsconfig.base.json`.
