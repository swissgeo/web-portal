# Log

## Step 1: replace `@/` aliases with `#` subpath imports

### Summary

Step 1 is done for all 13 packages: every `@/` and `@stores/` import now uses `#` subpath imports, and the old aliases are gone from the vite/vitest configs, the package tsconfigs and the shared tsconfig base. Nothing is committed. The changes are in the working tree (234 files).

**Verification**

- **Build output:** JS and CSS in every `dist/` are byte-identical to a baseline build of the unchanged code. In the type files, the only difference is that map's `.d.ts` now say `../types/index` instead of `../types`, which is the same file.
- **Type-check and lint:** pass across the whole repo, main included. Prettier finds nothing to fix.
- **Unit tests:** all library tests pass. In main, 157 of 159 test files pass. The two failures (`scripts/__tests__/i18nCsv.spec.ts`, `locales.spec.ts`) fail the same way with the changes stashed, and they passed in the first full run. The error is `Cannot find module '/@id/virtual:intlify-i18n-0'`, so it looks like stale local Nuxt/i18n state, not this change. `nuxt prepare` and clearing the vite cache didn't fix it.

**Things worth reviewing**

- **Leaking `#` imports in shipped types:** `unplugin-dts` copies `#foo` imports into the generated `.d.ts` unchanged. Main would then resolve them through the package's `imports` field to `src/*.ts` and type-check library source under its strict settings. To prevent that, a small helper (`subpathImportsDtsAlias` in `base.vite.config.ts`) rewrites them to relative paths in the d.ts only. coordinates has its own copy, because its tsconfig `rootDir` doesn't allow importing from the repo root. It goes away with the builds in step 4/5.
- **Eslint config:** `^#.*` was added to the import-sorting "internal" pattern in `config/eslint`, which is the plugin's own default. Side effect: 12 files in main had their Nuxt `#app`/`#imports` imports moved into that group (auto-fixed). The alternative was re-sorting all ~170 converted library files.
- **Removed external:** skeleton's vite config listed Nuxt's `#components` as external, but nothing imported it. It would have wrongly matched the new `#components/LogoPic.vue`, so it was removed.
- **Mapping:** imports stay without file extensions, so `"#*": "./src/*.ts"` covers most cases. Packages that import other file types get an extra key, e.g. `"#*.vue": "./src/*.vue"` (also `.css` and `.svg`). The 5 directory imports now point at `/index`.
- **Docs:** `config/typescript/README.md` now documents `#` imports instead of `paths`, and the import examples in `feature/README.md` use `#`.
- **PR split:** the plan says one PR per package, but everything was done together because it's mostly the same mechanical rewrite. Each package's changes are self-contained except for the eslint, tsconfig base and `base.vite.config.ts` edits, so the work can still be split.

### How the changes were made

#### 1. Survey before editing

- Collected every `@/` / `@stores/` specifier in the library `src` folders (91 unique specifiers) and resolved each one against the package's `src`:
  - 84 resolve to `<spec>.ts`
  - 15 have an explicit extension (`.vue` ×9, `.css`, `.svg`, plus names like `foo.composable` that are really `foo.composable.ts`)
  - 5 are directory imports to an `index.ts`: `content` `@/api` and `@/types`, `coordinates` `@/proj`, `map` `@/types`, `ogc` `@/types`
  - none were unresolved, so map's tsconfig fallback to `../skeleton/src/*` was never actually used
- Checked for `#` imports that already existed in the libraries: none. skeleton's `/#components/` rollup external was therefore dead code.
- Checked `@/` usage outside `src`: only `coordinates/setup-vitest.ts` (found late, see 6) and README examples. Main's `@/` is Nuxt's own alias and was left alone. skeleton's `~` alias was unused.

#### 2. Choice of mapping

Options considered:

- `"#*": "./src/*"` with explicit `.ts` extensions in every import. Rejected: needs `allowImportingTsExtensions` and touches every specifier more.
- `"#*": "./src/*.ts"` as in `vision.md`, plus extra pattern keys per extension. Chosen. Node/TS pick the longest matching key, so `#Foo.vue` matches `#*.vue` before `#*`. Specifiers stay extensionless and the edit is mostly a plain `@/` → `#` swap. Directory imports need an explicit `/index`.

#### 3. Pilot: numbers

- Added `"imports": { "#*": "./src/*.ts" }` to `package.json`, rewrote the single import in `src/__test__/numbers.spec.ts`, removed the alias from `vitest.config.ts`.
- `tsc`, vitest (23 tests), rolldown build and eslint all resolved `#` with no extra config. Prettier's packagejson plugin reorders the `imports` key, so `format:write` runs after each manifest edit.
- `config/eslint` `internalPattern` became `["^@/.*", "^#.*"]`. `@swissgeo/config-eslint` is used from its `dist`, so it has to be rebuilt (`pnpm build` in `packages/config/eslint`) before lint sees the change.

#### 4. Pilot: shared (per-file d.ts via unplugin-dts)

- Same conversion. The first build emitted `import { Lang } from '#language'` in `dist/globals.d.ts`. That would make consumers resolve into `src/language.ts` via the `imports` field.
- Read the `unplugin-dts` 1.0.3 source. It has an `aliases` option used only for declaration files. `transformAlias()` takes `path.relative(dir, replacement)` for absolute replacements, then calls `importer.replace(find, replacement)`. A regex `find` of `/^#([^/]+)/` with replacement `<abs src>/$1` therefore becomes e.g. `../$1`, and `String.replace` fills in `$1`. So `#stores/position` becomes `../stores/position`.
- Added `subpathImportsDtsAlias(srcDir)` to `base.vite.config.ts` and passed it to `dts({ aliases: [...] })`. The rebuilt `globals.d.ts` was identical to the pre-change file (`'./language'`). Type-check, lint and 153 tests passed.

#### 5. Bulk conversion of the remaining 11 packages

A conversion script (`slop/scripts/step_1/to_subpath.py`, usage: `python3 slop/scripts/step_1/to_subpath.py packages/<name>`), run per package:

- regex `(['"])@(stores)?/([^'"]+)\1` over `src/**/*.{ts,vue,mts,tsx}`, which also covers `vi.mock(...)` and dynamic `import(...)`
- each specifier resolved against `src`: exact file, `+.ts`, or `/index.ts` (gets `/index` appended); aborts on anything unresolved; `@stores/x` becomes `#stores/x`
- non-`.ts` extensions it encounters are collected and an `imports` field is written: `#*` plus `#*.<ext>` for each

Result:

| package | files rewritten | `imports` keys |
|---|---|---|
| content | 9 | `#*` |
| coordinates | 30 (+ `setup-vitest.ts`) | `#*`, `#*.vue` |
| dimension | 10 | `#*`, `#*.vue` |
| drawing | 15 | `#*` |
| elevation-profile | 17 | `#*`, `#*.css`, `#*.vue` |
| feature | 7 | `#*` |
| layers | 5 | `#*` |
| map | 53 | `#*` |
| ogc | 24 | `#*` |
| search | 3 | `#*` |
| skeleton | 3 | `#*`, `#*.svg`, `#*.vue` |
| numbers (pilot) | 1 | `#*` |
| shared (pilot) | 1 | `#*` |

Config edits, done with a second scripted pass and checked by diff:

- removed `resolve: { alias: { "@" / "@stores" / "~" } }` blocks from `vite.config.ts` and `vitest.config.ts`, and the `fileURLToPath, URL` imports that became unused
- added `aliases: [subpathImportsDtsAlias(resolve(__dirname, "src"))]` to every `dts({...})`, importing the helper next to `getBaseBuildConfig`
- coordinates doesn't import `base.vite.config` at all, and its tsconfig `rootDir` is the package (TS6059 when importing it). There the alias is inlined: `{ find: /^#([^/]+)/, replacement: resolve(__dirname, "src/$1") }`
- removed `/#components/` from skeleton's rollup `external`
- removed `paths` from the tsconfigs of content, drawing, feature, layers, map (including the `../skeleton/src` fallbacks and `@stores/*`), ogc, skeleton, and from `packages/config/typescript/tsconfig.base.json`
- ran `pnpm run format:write` at the root

#### 6. Verification and fixes

- **Baseline:** stashed all changes, rebuilt `config/eslint` and ran `pnpm run build-libs`, snapshotted every `dist/**/*.{d.ts,js,css}`, then restored the changes. The same build with the changes applied was snapshotted and compared with `diff -r`:
  - JS/CSS identical everywhere
  - `.d.ts` differ only in map (`'../types'` → `'../types/index'`), `map/dist/base.vite.config.d.ts` (the new helper) and the eslint config bundle
- **Build TS diagnostics:** `unplugin-dts` reports TS2883 ("inferred type … not portable") in `map/src/composables/__tests__/__mocks__/composables.ts` and `elevation-profile/src/composables/useElevationProfileChart.ts`. Same errors in the baseline, so they were already there. Two errors were new and fixed:
  - `coordinates/setup-vitest.ts` still imported `@/registerProj4` → `#registerProj4`
  - TS6059 rootDir error from coordinates importing `base.vite.config` → inlined, see 5
- **Root checks:** `pnpm run type-check`, `lint`, `format`, `test:unit`.
  - Type-check and tests passed; lint and format failed.
  - format: coordinates `vite.config.ts` (fixed with `format:write`)
  - lint: 6 perfectionist sort errors in coordinates (`#proj/CoordinateSystem` before `#proj/index`), and 15 in main. Adding `^#.*` had reclassified Nuxt's `#app`/`#imports` there as internal. perfectionist 5.13's default `internalPattern` is `['^~/.+', '^@/.+', '^#.+']` (the repo's config had overridden it), so `#` stays internal and `eslint --fix` was run in coordinates and main (12 files in main, imports moved only).
  - Re-run: type-check, lint and format pass. All library tests pass.
  - main: 157/159 test files pass, 1375 tests. The two `scripts/__tests__` files fail with `virtual:intlify-i18n-0`. They fail identically with the changes stashed, and also after `nuxt prepare` and clearing `node_modules/.cache/vite`. Not caused by this step; still open.
- **Docs:** `config/typescript/README.md` replaced the `paths` examples with an "Imports inside a package" section. `feature/README.md` import examples changed to `#`.
