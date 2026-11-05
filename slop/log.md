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

## Step 2: turn on `strictNullChecks`

### Summary

`strictNullChecks` is now on for every package that extends the shared tsconfig. `"strictNullChecks": false` is removed from `packages/config/typescript/tsconfig.base.json`, so the `strict: true` inherited from `@vue/tsconfig` applies in full. No per-package overrides are left. 50 files changed, not committed.

**Verification**

- **Type-check:** passes across the whole repo, including main (`nuxt typecheck`) and `tests/integration`.
- **Lint and format:** pass.
- **Build:** all libraries build. The only TS diagnostics are the TS2883 ones that were already there before step 1.
- **Unit tests:** same result as after step 1. All library tests pass; main has 157/159 files and 1375 tests passing. The same two `scripts/__tests__` files fail for the same unrelated `virtual:intlify-i18n-0` reason.

**Behavior differences worth reviewing**

Most fixes only change types. These places do something different at runtime from before. In each case the old code would have thrown, logged an error, or used a value it shouldn't have:

- `layers` `getInfoFromDataset`: a featureinfo/dataservice record without `links` now returns `undefined` quietly. Before, `links.find` threw, the `catch` logged "Unexpected error" and then returned `undefined`.
- `drawing` `convertKmlToSwissGeoPoints`: if the icon's anchor isn't known yet (`getAnchor()` returns `null`), `ICON_ANCHOR_KEY` isn't set. Before, this threw.
- `drawing` `exportUtils` icon lookup: styles without an image are skipped. Before, `"getSrc" in null` threw.
- `drawing` store `mountDrawingLayer(null)` is now always a no-op. Before, it was a no-op only while nothing was mounted, and threw otherwise. Main calls it with `useMap().olMap.value`, which can be `null`.
- `dimension` `TimeSlider`: layers listed as having a time dimension but without one are left out of `layerTimeDimensions`. Before, they would have thrown when their `availableValues` was read.
- `feature` store `getFeaturesGeoJSON`: features with `null` geometry are left out. Its only consumer is main's highlight layer, so nothing visible changes, and the declared `FeatureCollection` type is now true.
- `map` `useMap`: `zoomLevel` keeps its previous value when `view.getZoom()` returns `undefined`. Before, it was set to `undefined` despite being typed `number`, and main's print framing then computed `Math.round(undefined)`, which is `NaN`.
- `map` KML layer: an icon whose anchor isn't known passes `anchor: undefined` (OL default `[0.5, 0.5]`) instead of `null`, which OL would have tried to index later.
- `map` `useOlMapContextMenu` / `useOlMapPosition`: no viewport means no listeners (before: threw), and a projection without bounds gives an `undefined` initial center (before: threw).
- `ogc` / `feature` / `layers` error logging: `${error.toString()}` became `${String(error)}`. Same output, except it no longer throws if something rejects with `null`/`undefined`.

Kept as before on purpose: `map` `useAddLayerToMap` still passes an `undefined` zIndex on to OL (`as number`), because OL then falls back to the layer's position in the collection. Using `?? 0` would change how layers stack.

### How the changes were made

#### 1. Measuring

- Each package's type-check, without changing any files: `npx vue-tsc -p tsconfig.json --noEmit --strictNullChecks` (or `tsc` for the plain packages). Errors per package:

  | package | errors | files |
  |---|---|---|
  | map | 66 | 22 |
  | coordinates | 46 | 6 |
  | ogc | 27 | 4 |
  | drawing | 11 | 4 |
  | feature | 9 | 3 |
  | layers | 6 | 1 |
  | dimension | 4 | 1 |
  | elevation-profile | 2 | 2 |
  | shared, search | 1 each | 1 |
  | numbers, log, drawing-sharing, statesharing, content, skeleton, config/eslint, config/prettier | 0 | |

- `config/stylelint` has no type-check script. Its `tsc` run fails with TS18003 ("No inputs were found") both with and without the flag, so that error was already there.
- `tests/integration` also extends the base config, but wasn't in this first pass. It showed up later (see 4).

#### 2. Fixing per package, dependencies first

Order: shared, search, elevation-profile, dimension, feature, layers, drawing, ogc, coordinates, then a rebuild of all libraries (`pnpm run build-libs`) so map type-checks against the new `.d.ts`, then map. Each package temporarily got `"strictNullChecks": true` in its own tsconfig to lock in the fixes. Those lines were removed again in step 3. Edits were made with small Python replace scripts that check each search string matches exactly the expected number of times.

Rules used:

- **Source:** narrow or guard where the value really can be missing. Make the declared types match what the code actually handles (e.g. `getAvailableCrs`, `getLayerName` and `firstDirectChild` accept `null | undefined`, which their tests already pass in; `getFeatureInfoCapability` returns `... | null`, which it always did). Use `!` only where an invariant guarantees the value, with a comment: `validateDataset` guarantees the self link, LV95 always has bounds, `shift()` inside `while (length > 0)`, `pop()` after a `length` check, `getLinearRing(0)` on polygons built by `fromCircle`.
- **Tests:** `!` on values the test itself has just set up, type annotations on mocks (`vi.fn<() => X | null>`, `ref<X | null>`), `let x!:` for definite assignment, and `@ts-expect-error` where a test passes invalid input on purpose (`search` `attrs = null`).

Notable details:

- `elevation-profile`: the composable's ref parameters became `Readonly<Ref<... | null | undefined>>` and `{ chart?: Chart | null }`. That matches what `useTemplateRef` and vue-chartjs return.
- `feature`: `isIdentifyFeatureInfo` became a type guard (`featureInfo is { protocol: string; baseUrl: string }`), returning `!!...` instead of `string | boolean | undefined`.
- `map` `position.spec.ts`: typing the hoisted mocks created a type cycle with `animateMock`, which TS reported as implicit `any` (TS7022). It was fixed by creating `animateMock` inside `vi.hoisted` before the factories that use it. That also made one `@ts-expect-error` unnecessary, and it was removed.
- `map` `position.ts`: the store's caches were `ref([])`, so their element type was `never`. They are now `ref<number[]>` / `ref<SingleCoordinate[]>`. The `watch` callback dropped its wrong parameter annotation (`olMap: olMap`, while the store holds `Map | null`) and lets TS infer the types.

#### 3. Flipping the base config

- Removed `"strictNullChecks": false` from `tsconfig.base.json`, and removed the temporary per-package `true` lines again (shared, search, elevation-profile, dimension, feature, layers, drawing, ogc, map, coordinates).
- Checked that every tsconfig extends `tsconfig.base.json` or `tsconfig.vue.json`, both of which end up at `@vue/tsconfig`'s `strict: true`. Main uses its Nuxt-generated config, which was already strict.

#### 4. Consumers of the stricter types

With the flag on, the emitted `.d.ts` keep `| null` / `| undefined`. Before, those were dropped from the shipped types. After a rebuild, `pnpm run type-check` found 22 new errors in places that had relied on the looser types:

- `tests/integration` (8): `window.swissgeoOlMap` is typed `OlMap | undefined`. Added `!` to `evaluateHandle(() => window.swissgeoOlMap!)`, which the tests only call after waiting for the map.
- main `useAttributionSources`: `backgroundLayer` accepts `Layer | null | undefined`, which is what the layers store holds. The body already used `?.`.
- main `BaseMapViewer` highlight layer: `null` geometries came from the feature store. Fixed in the store, see the behavior notes. This replaced a first attempt that only widened the store's type, which then spread into map's `GeoJSONLayer` and its reprojection code.
- main `ElevationWindow`: `geometry!` inside the `type === "LineString"` branch.
- main `LayerVariantSelect`: `distribution ? variantLabel(distribution) : undefined` instead of `distribution && ...`.
- main `PointStyleEditor` / `IconPicker` / `PlacementSelector`: the drawing style values are `X | null` when no point feature is focused. The child props accept `null`. `IconPicker` maps `null` to `undefined` for `USelect`. The two size selects use `:model-value="x ?? undefined"` and `@update:model-value="x = $event as keyof typeof TEXT_SIZE"` (or `ICON_SIZE`), because `USelect` emits `string` and `TextSize` isn't exported from `@swissgeo/drawing`.
- main `drawing.vue` / `useImportDrawing`: `olMap.value` can be `null`. Fixed by letting the drawing store's `mountDrawingLayer` accept `null`. `importDrawingKmz`'s `map` parameter is now `OlMap | null`.

#### 5. Final checks

`pnpm run format:write`, `build-libs`, `type-check`, `lint`, `format` and `test:unit` from the repo root, with the results listed under Verification.

### Follow-up after review

- **`bounds` is now required on `CoordinateSystem`** (`coordinates/src/proj/CoordinateSystem.ts`). Every real coordinate system already defined bounds (LV95, LV03, WGS84, WebMercator; `CustomCoordinateSystem` already required them), and the app relied on that.
  - `CoordinateSystemProps.bounds` and the `bounds` field are no longer optional. `getBoundsAs()` returns `CoordinateSystemBounds` (no `| undefined`).
  - Removed the no-bounds branches: `isInBounds` → `false`, `getResolutionSteps` → `[]`, `getTileOrigin` → `[0, 0]`, `getBoundsAs` → `undefined`.
  - Tests: `BoundlessCoordinateSystem` became `TestCoordinateSystem` with bounds. The 4 tests for the no-bounds fallbacks were removed (coordinates: 249 → 245 tests). The test-only systems in `registerProj4.spec.ts` got bounds.
  - Removed the `!` / `?.` that were only there because bounds was optional: `DEFAULT_PROJECTION.bounds!` in map (and its comment), `bounds?.center` in `useOlMapPosition`, `bounds?.flatten` in `olWMSLayer.composable.ts` and `coordinates/src/ol.ts`, and the `getBoundsAs(...)!` / `projection.bounds!` in tests.
- **`TextSize` and `IconSize` are exported from `@swissgeo/drawing`.** `PointStyleEditor` now casts with `$event as TextSize` / `$event as IconSize` instead of `keyof typeof TEXT_SIZE` / `ICON_SIZE`.
- Checks: build, type-check, lint and format pass. Unit tests as before (main: same two unrelated `scripts/__tests__` failures).
