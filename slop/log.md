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

## Step 3: remove the hidden Nuxt coupling and the unexported ambient types

### Summary

The libraries no longer rely on Nuxt globals or on ambient type files that only their own tsconfig includes. Every type they need is now part of their import graph, so whoever compiles their source (main, from step 4 on) gets the types too. 19 files changed.

- **skeleton:** the search store no longer calls a global `useRuntimeConfig()`. It reads a `SearchConfig` with `inject(searchConfigKey)`, and both are exported from `@swissgeo/skeleton`. Main provides the config from its existing `skeleton-package` plugin. `skeleton/types/index.d.ts`, which declared the fake global, is deleted.
- **content:** the local function named `useRuntimeConfig` only returned hard-coded placeholder menu ids. It is now a plain `PLACEHOLDER_MENU_META_DATA` constant with the same values.
- **map:** `declare module "reproject"` in `env.d.ts` is replaced by a typed wrapper module, `src/utils/reproject.ts`, which `geoJsonUtils.ts` imports.
- **elevation-profile:** the `chart.js` plugin-option augmentations moved from `src/types/chartjs.d.ts` into the plugin files that define those options.
- **map, layers:** `env.d.ts` deleted. Its `Window.map` global was unused, and its `const ... = window.... || {}` lines did nothing.

**Verification**

- Build, type-check, lint and format pass. No `#` imports in any `dist/**/*.d.ts`.
- Unit tests: same results as after step 2, plus one new main test (main: same two unrelated `scripts/__tests__` failures).
- New `packages/main/app/plugins/__tests__/skeleton-package.nuxt.spec.ts`: boots the Nuxt app with its plugins and creates the real search store. It fails with "no SearchConfig provided" when the plugin's `provide` call is removed, which was checked by hand and then restored.
- Production build of main (`pnpm build` + `nuxt preview`): `/de/map` renders with status 200 and no server errors.
- Playwright `tests/integration/topbar.spec.ts`: 8 passed, 1 flaky. "a typed coordinate moves the map without any result to select" timed out on its first attempt, on the crosshair marker check right after the dev server had started, and passed on retry. It then passed 5/5 with `--repeat-each 5 --retries 0`.

**Things worth reviewing**

- `useSearchStore` now throws if no `SearchConfig` was provided. Before, it relied on a Nuxt auto-import global, so it only worked inside Nuxt anyway.
- `enableCmsSearch` is still read once when the store is created, as before.
- `elevation-profile`: the old `.d.ts` used `DataModelPluginOptions<TType>`, but that interface isn't generic. The error was hidden because `skipLibCheck` skips `.d.ts` files, and the moved code drops the type argument. The augmentation keeps the unused `TType` parameter, because merged interfaces need identical type parameters. It has an `eslint-disable-next-line @typescript-eslint/no-unused-vars` with that reason.
- `map/src/utils/reproject.ts` uses `// @ts-expect-error TS7016` on the import of the untyped package. An ambient `declare module "reproject"` can't go into a module file (TS2665: an untyped module can't be augmented), and a `.d.ts` file would again depend on the consumer's tsconfig.
- Not changed, noted for later: main's `skeleton-package` plugin also registers Nuxt UI components globally (`UButton`, `UInput`, …) so skeleton's components can use them. That is Nuxt coupling too, and belongs to step 6 (Nuxt layers). Also, content and main each define a Pinia store with the id `"menuStore"`.

### How the changes were made

#### 1. Survey

- `grep` for `useRuntimeConfig` in the libraries: only `skeleton/src/stores/search.ts` (the real global, typed by `skeleton/types/index.d.ts`, stubbed with `vi.stubGlobal` in its test) and `content/src/stores/menu.ts` (a local function).
- `grep -l "declare global\|declare module"` outside main: `map/env.d.ts`, `layers/env.d.ts`, `elevation-profile/src/types/chartjs.d.ts`.
- Uses: `window.map` nowhere. `window.swissgeoOlMap` is set in `map/src/openlayers/OpenLayersMap.vue` with an inline cast and typed in `tests/integration/setup.ts`. `reproject` is imported only in `map/src/utils/geoJsonUtils.ts` and has no types (no `types` field, no `.d.ts`).

#### 2. skeleton search config

- New `skeleton/src/config.ts`: `SearchConfig` (`searchServiceUrl`, `ogcApiEndpoint`, `ogcCatalogCollection`, `enableCmsSearch`) and `searchConfigKey: InjectionKey<SearchConfig>`. Exported from `src/index.ts`.
- Store: `inject(searchConfigKey)` in the setup function, throwing a clear error when it's missing. Pinia runs setup stores inside the app context, so app-level `provide` reaches them. The checked value is bound to `const config: SearchConfig`, because narrowing doesn't carry into the store's hoisted `function` declarations (TS18048). The `as string` casts are gone.
- Main: `app/plugins/skeleton-package.ts` provides the four values from `useRuntimeConfig().public` (`enableCmsSearch: featureFlags?.enableCmsSearch === true`, the same expression as before). Nuxt runs plugins alphabetically, and no plugin or middleware uses the search store.
- Test: `vi.stubGlobal("useRuntimeConfig", …)` is replaced by an `activatePinia()` helper that creates a Vue app, installs Pinia on it and provides a test `SearchConfig`.
- Deleted `skeleton/types/index.d.ts`, and removed `types/**/*.d.ts` from `skeleton/tsconfig.json`.

#### 3. content placeholder

`function useRuntimeConfig()` plus `_initMenuIds` reading `runtimeConfig.public.aboutMenu` / `knowledgeMenu` became `PLACEHOLDER_MENU_META_DATA = [{ id: 1, translationKey: "a" }, { id: 2, translationKey: "b" }]`, with a comment saying where the real values should come from. Same values.

#### 4. Ambient types

- elevation-profile: `declare module "chart.js" { interface PluginOptionsByType<TType extends ChartType> { … } }` added at the end of the options interface in `datamodel.plugin.ts` and `nodata.plugin.ts`, both imported by `src/index.ts`. `useElevationProfileChart.ts` (`plugins.noData`, `plugins.dataModel`) still type-checks against them. Deleted `src/types/chartjs.d.ts`, and removed `types/**/*.d.ts` from the tsconfig.
- map: `src/utils/reproject.ts` exports `reproject` with the same two overloads as the old ambient declaration. `geoJsonUtils.ts` imports it from `#utils/reproject`. Deleted `env.d.ts`, and removed `env.d.ts` and `types/**/*.d.ts` from the tsconfig.
- layers: deleted `env.d.ts`, and removed it from the tsconfig.

#### 5. Checks

Root `format:write`, `build-libs`, `type-check`, `lint`, `format`, `test:unit`, then the main production build, the preview render, the new Nuxt test (passing, and failing without the `provide`), and the Playwright topbar tests, with the results listed under Verification. The first Playwright attempt failed because the browsers weren't installed. After the user installed them, the tests ran as described.

## Step 4: switch `exports` to source

### Summary

All 16 library packages are consumed as source now: `exports` point at `src/*.ts`, their vite/rolldown library builds, `dist/` output and build-only scripts and devDependencies are gone, and main compiles their source with its own Vite and type-checks it with its own tsconfig. Only `packages/config/eslint` and `packages/config/prettier` still build (tooling), and `coordinates` keeps a `vite.config.ts` for its demo app. Not committed.

**Verification**

- Build (remaining tooling builds), type-check, lint and format pass across the repo; main's production build passes.
- Unit tests: all library tests pass, main 1376/1377 with the same two flaky `scripts/__tests__` files as before (`virtual:intlify-i18n-0`; they passed in some runs during this step and failed in others).
- Dev server: `/`, `/de/`, `/de/map` and `/fr/` render (302/200) with server-side rendering.
- Playwright, full suite with its own dev server: 49 passed, 4 flaky (passed on retry). The 4 are the first test of their spec file, all timing out on the first page load of a cold dev server (Vite compiles the package source on demand now, with 4 workers loading at once). CI runs `playwright.config.ci.ts` against a production build instead, which wasn't run locally (see Follow-ups).

**Things worth reviewing**

- **Main type-checks package source with stricter flags.** Main's Nuxt tsconfig has `noUncheckedIndexedAccess` and `noImplicitOverride`, the packages don't. Main only compiles what it imports, so only package *source* had to be fixed (about 70 errors in ~20 files; package tests aren't imported by main and still don't use these flags). Correction to what I said while working: `noImplicitOverride` did matter (3 missing `override` in coordinates).
- **OpenLayers in SSR (new step added to `plan.md`).** The map is rendered only on the client, but ~35 main files value-import `@swissgeo/map` / `drawing` / `elevation-profile` / `ol/*`, so the server imports (doesn't use) all of OpenLayers. Before, map's `dist` contained a bundled browser copy of `ol`, so nobody noticed. Now Node loads the real `ol`, and `ol/source/GeoTIFF` → `geotiff` → `web-worker` throws when imported inside a Node worker thread, which is where Nuxt dev renders the server side (`Cannot destructure property 'mod' of 'threads.workerData'`). Fixed for now (the user chose this):
  - map's COG layer composable imports `ol/source/GeoTIFF` on first use (`import()`), with a version counter so a slower earlier load can't overwrite a newer layer. The layer is now created after that import resolves, i.e. a moment later than before.
  - the `ol/source` barrel re-exports GeoTIFF, so its 4 value imports (3 in main, 1 in map) became direct imports (`ol/source/Vector`, `ol/source/ImageWMS`, `ol/source/TileWMS`).
- **CSS:** `@swissgeo/map/stylesheet` and `@swissgeo/dimension/stylesheet` exports and their `@import`s in `main.css` are removed: SFC styles come with the components, and `map/src/index.ts` already imports `stylesheet.css` (`ol/ol.css`), which now loads with the JS instead of from `main.css`. `OpenLayersScale.vue` uses `@apply`, which only worked because `main.css` imported the built `map.css`; its style block got `@reference "tailwindcss"` and map a `tailwindcss` devDependency. elevation-profile's unused `./stylesheet` export is gone too (its `index.ts` imports its CSS itself).
- **Dependency declarations.** Runtime imports that weren't declared, and only resolved through the root `package.json` or pnpm's auto-installed peers, are declared now: coordinates `@turf/turf` (devDependencies → dependencies) and `ol` (peer); skeleton `@swissgeo/ogc` (devDependencies → dependencies); `pinia` peer in drawing, map, skeleton; `vue` peer in feature, layers.
- **Behavior differences** (all in places that would have thrown or passed `undefined` on):
  - `drawing` polygon vertex style: a polygon without rings draws no vertices (`?? []`) instead of `new MultiPoint(undefined)`.
  - `map` `transformIntoTurfEquivalent`: an empty `GeometryCollection` returns `undefined` (its declared "nothing" result) instead of reprojecting `undefined`.
  - map COG layers: created after the lazy GeoTIFF import, see above.
- **Kept as before on purpose:** `map` `createView()` only creates an LV95 view, so for any other projection it returns `undefined` despite its `View` return type. It got a `!` and a comment instead of a behavior change.
- **Removed:** shared's `./geojson` export (pointed to a `dist` file the build never produced; nothing imported it); coordinates' `preview` script (it served the removed library build); two self-imports (`coordinates/src/militaryGridProjection.ts` imported `@swissgeo/coordinates`, a map test imported `@swissgeo/map`), now `#` imports.

**Follow-ups**

- Run `playwright.config.ci.ts` against a local production build (`build:dev` + `node .output/server/index.mjs` with `.env.test`), as CI does. Skipped for now (user).
- Dev cold-start flakiness in Playwright (first test per spec file): e.g. Vite `server.warmup` for the main entry, or a warm-up request in a global setup.
- vitest 5 shares one module cache for the workspace (`node_modules/.vitest-cache`) and clears it when the lockfile changed; the root `test:unit` runs all packages in parallel, so the first run after a lockfile change can fail with `ENOTEMPTY` (seen twice in this step; the next run is fine).
- Leftovers for step 5: `base.vite.config.ts` (`getBaseBuildConfig`, `subpathImportsDtsAlias`) is no longer used; `"rootDir": "../.."` in several package tsconfigs only existed for it; turbo and the `build-libs*` / `build:dev:watch` root scripts.
- Possibly later: turn on `noUncheckedIndexedAccess` / `noImplicitOverride` in the shared base config too (needs the ~270 test errors fixed), so packages catch these themselves instead of only through main's type-check.

### How the changes were made

#### 1. Measuring main's extra flags

Compared main's generated `.nuxt/tsconfig.app.json` with the packages' config. `verbatimModuleSyntax` was already on in the packages (from `@vue/tsconfig`); `noUncheckedIndexedAccess` and `noImplicitOverride` weren't. Each package type-checked with `--noUncheckedIndexedAccess --noImplicitOverride`: ~336 errors, ~70 of them in source files (the rest in tests).

#### 2. Scripts

- `slop/scripts/step_4/to_source.py <pkg> '<exports json>'`: replaces `exports`, removes `files`/`main`/`module`/`types`, the `build*`, `prepare` and declaration-only `generate-types` scripts, the build-only devDependencies (`rolldown`, `rolldown-plugin-dts`, `unplugin-dts`, `@microsoft/api-extractor`), and the build configs from the tsconfig `include`. Deleting the config files and `dist/` was done separately (`git rm`, `rm -rf`).
- `slop/scripts/step_4/verify.sh <log dir>`: `format:write`, `build-libs`, `type-check`, `lint`, `format`, `test:unit`, main `build`, one status line each.

#### 3. Order and the transition

Leaves first, as planned: numbers, log, drawing-sharing, statesharing, shared, coordinates, ogc, layers, feature, search, dimension, drawing, elevation-profile, content, skeleton, map. Each switch: fix that package's source for main's flags, run `to_source.py`, delete the build config and `dist/`, `pnpm install`, `verify.sh`.

Problems of the mixed state (packages still building on top of packages already consumed as source), all gone now with the build configs:

- With shared as source, ogc's `rolldown-plugin-dts` tried to inline shared's source types and failed (`"MapLibreStyleDocument" is not exported by "../shared/src/index.d.ts"`). Because `pnpm --recursive` stops at the first failing package, the other libraries hadn't rebuilt and type-check passed against stale `dist/`. From then on all `dist/` folders were deleted before verifying.
- First fix: `@swissgeo/*` external in all remaining builds. That broke 40 main tests (`Could not parse to valid json: EPSG:2056`): map's build bundled its own copy of `proj4`, while coordinates, now external, registered the projections on the real one.
- Second fix: every bare import external in the remaining builds (`external: (id) => !/^(\.|\/|#|\0|[A-Za-z]:)/.test(id)`), i.e. the dist only contained the package's own code, like source consumption does. That surfaced the SSR problems (Node can't resolve extensionless `ol/geom/Polygon` from a `dist` file because `ol` has no `exports` map; the GeoTIFF/`web-worker` crash).
- Self-imports by package name broke once `@swissgeo/*` was external; replaced by `#` imports.

#### 4. Source fixes for main's flags

Typed destructures or `!` with a comment where an invariant guarantees the value (mandatory regex groups, length checks just above, loop bounds, OL coordinates/sizes/pixels being `[x, y]`, touch events having a first touch), `?.`/`??` where that's equivalent, and narrowing on local constants:

- shared: `toRgbaColor` (`match(...)?.[1]`), measurement segment coordinates, `pickLocaleFromAcceptLanguage`.
- coordinates: `coordinateFromString` (regex groups, the two-value degrees tuple), `getLetterDesignator`, `override` on `getTileOrigin` / `getResolutionSteps` / `roundZoomLevel`, `transformStandardZoomLevelToCustom` (matrix entries read into `minStandardZoom` / `maxStandardZoom` so `typeof` checks narrow).
- feature: `lt130` (`as const` base, three-part version tuple); the WMS version is computed once (`wmsVersion`) and used for both the `VERSION` param and `lt130`.
- search: bounding box regex groups. dimension: first touch of touch events.
- drawing: `rgbaToHex`, `defaultIconName` (`getDefaultIconSet()?.icons[0]?.name ?? ""`), icon anchor, offset parsing, `getLinearRingLength`, polygon vertices (`?? []`).
- elevation-profile: tooltip uses `const point = tooltip.dataPoints[0]; if (point && …)` (same as the old `length > 0` check).
- map: `createView` (`!`), click event viewport size, compare slider render pixel, print scale map size, `transformIntoTurfEquivalent`.

#### 5. Per-package specifics

- coordinates: `vite.config.ts` reduced to the demo app's plugins (`tailwindcss`, `vue`, `vueDevTools`), kept in the tsconfig `include` because `vitest.config.ts` merges it; `preview` script removed; exports `.` and `./ol`.
- log: exports `.` and `./Message`; its `prepare` script (`pnpm run build`) removed.
- shared: exports `.`, `./language`, `./action-dispatcher` (the latter two were types-only before).
- skeleton: its test config lived in `vite.config.ts`; moved to a new `vitest.config.ts`.
- map: lazy GeoTIFF, direct `ol/source/*` imports (and the WMS layer spec mocks `ol/source/TileWMS` / `ol/source/ImageWMS` instead of the barrel), `@reference "tailwindcss"`, COG spec waits for `vi.dynamicImportSettled()`.

#### 6. Dev server and Playwright

- Playwright's `webServer` timed out twice: it waits for `/` to answer with a non-error status, and `/` returned 500 (the SSR import errors above). After the fixes `/` answers 302.
- One run reused a dev server I had started without Playwright's `webServer.env` and got 12 failures, invalid. The env was then extracted from `playwright.config.ts` (`node --experimental-strip-types` on a small script that prints it as `export` lines) for a manually started server. An earlier attempt with `npx tsx` downloaded `tsx` from the npm registry; not used again.
- With a cleared Vite cache and a full browser run, Vite found all dependencies in its startup scan, so pre-bundling with `optimizeDeps.include` wouldn't help the flaky first tests; not added. (The runtime dependency discovery seen earlier only happened with curl-only requests.)
