# POC: Standard (MapLibre) GeoJSON styling — GPS-732

## Context

We want to move GeoJSON layer styling from geoadmin's proprietary "literals" style
format (`type: single|unique|range` + `vectorOptions`) to the **standard MapLibre/
mapbox-gl style spec**, applied through the already-installed-but-unused
`ol-mapbox-style` package. There are ~60 layers, so the conversion must be
**automatable**.

### Production end-state & migration sequence (settled)

The proprietary geoadmin styles (~60) are **not in this repo** — they're served from
geoadmin's static style server and discovered at runtime via each dataset's OGC API
Records distribution link `rel: "styledby"` (`packages/ogc/src/records/useStyle.ts`,
`useGeoJson.ts`). The production end-state is **offline/batch**:

1. **POC (this work):** build the converter + `ol-mapbox-style` rendering path, test
   on **one** layer at runtime via a debug button, **side-by-side** with the
   untouched legacy converter (zero risk to the other 59 layers).
2. **Batch (follow-up):** run the converter offline over all ~60 `styledby` styles →
   hosted standard MapLibre JSON files → repoint OGC records' `styledby` links to them.
3. **Cleanup (follow-up):** app then consumes only standard styles; **delete**
   `geoJsonStyleFromLiterals.ts` and the (transitional) converter.

Note the legacy file `geoJsonStyleFromLiterals.ts` does **two** jobs that we are
splitting: (a) **parse** literals → replaced by the offline **converter**
(`geoadminToMapLibreStyle`, eventually not shipped in the app); (b) **render** to OL
`Style` → replaced **permanently** by `ol-mapbox-style`. The renderer path stays; only
the literals converter is transitional.

This POC proves the full pipeline on one real layer:

1. A **reusable converter** geoadmin-literals → MapLibre style (handles
   single/unique/range; faithful point shapes via generated symbol icons).
2. **Consuming MapLibre styles in OpenLayers** via `ol-mapbox-style`'s
   `stylefunction`, added **side-by-side** with the legacy converter (legacy stays
   until a follow-up cleanup ticket).
3. A **dev-only test harness** (local fixtures) to load a GeoJSON layer + its
   converted style into the running map.
4. **Tests** — unit tests for the converter + manual visual verification.

### Key findings from exploration

- Runtime path: `OpenLayersGeoJSONLayer.vue` → `useOlGeoJSONLayer`
  (`packages/map/src/composables/olGeoJSONLayer.composable.ts`) →
  `OlStyleForPropertyValue` (`packages/map/src/utils/geoJsonStyleFromLiterals.ts`,
  the 514-line legacy converter).
- `ol-mapbox-style` v13 is in `packages/map/package.json` but unused.
  `stylefunction(olLayer, glStyle, sourceId, …, getImage)` applies a mapbox style
  to an existing `VectorLayer`+`VectorSource` and accepts a `getImage` callback for
  supplying icons by name — this is how we render non-circle point shapes faithfully.
- The styled (non-local) GeoJSON path is currently **dormant**:
  `FileConverter.vue` never sets `geoJsonData`/`geoJsonStyle`, and no OGC GeoJSON
  converter exists. So injecting a fully-formed map `GeoJSONLayer` via the debug
  panel is the cleanest, lowest-risk test harness.
- Real input example (`unique`, point shapes circle/triangle/square with rotation):
  `https://sys-api3.dev.bgdi.ch/static/vectorStyles/ch.bafu.hydroweb-messstationen_grundwasser.json`.
- MapLibre renders points only as circles natively → triangle/square/star/cross/
  hexagon are generated as canvas icons and drawn via `symbol` layers (`icon-image`,
  `icon-rotate`).

## Approach

### 1. Converter — `packages/map/src/utils/geoadminToMapLibreStyle.ts` (NEW)

Pure function, no OL deps:

```
geoadminToMapLibreStyle(
  geoadmin: GeoAdminGeoJSONStyleDefinition,
  sourceId: string,
): { style: maplibre Style; icons: ShapeIconSpec[] }
```

- Output is a MapLibre style: `{ version: 8, sources: { [sourceId]: { type: "geojson" } }, layers: [...] }`.
- Per geoadmin definition entry (single / each `values[]` / each `ranges[]`):
  - **filter**: unique → `["==", ["get", property], value]`; range →
    `["all", [">=", ["get", property], min], ["<", ["get", property], max]]`;
    single → no filter.
  - **geomType → layer type + paint** (reuse the mappings already encoded in
    `geoJsonStyleFromLiterals.ts`):
    - `polygon` → `fill` (`fill-color` from `fill.color`) + `line` (stroke).
    - `line` → `line` (`line-color`, `line-width`).
    - `point` + `circle` → `circle` (`circle-radius`, `circle-color`,
      `circle-stroke-color/width`).
    - `point` + other shape → `symbol` with `icon-image` = a deterministic icon
      name (e.g. `sg-triangle-<fill>-<stroke>-<radius>`), `icon-rotate` from
      geoadmin `rotation` (radians → degrees), `icon-allow-overlap: true`. Each
      distinct shape is pushed to the returned `icons[]` spec list.
  - **label** (`vectorOptions.label`) → `symbol` layer with `text-field`. Convert
    geoadmin's `${prop}` template to MapLibre `["case"/"concat", ["get", …]]` or a
    `format`/`get` expression; carry font/scale/offset/fill/stroke into
    `text-*`/`paint`. (For the POC, a single-property template is enough; document
    multi-token templates as best-effort.)
  - **min/maxResolution → minzoom/maxzoom**: add a small `resolutionToZoom` helper
    using the map view's resolutions (from `usePositionStore().projection`). Mark
    as approximate; the demo layer has no resolution bands so this is best-effort.

### 2. Shape icon generation — `packages/map/src/utils/maplibreShapeIcons.ts` (NEW)

- `createShapeIcon(spec: ShapeIconSpec): HTMLCanvasElement` draws circle / triangle /
  square / star / cross / hexagon onto a canvas with the given fill/stroke/radius —
  geometry mirrors `getOlImageStyleForShape` in the legacy file (points count, angles,
  `radius2` for star/cross).
- `makeGetImage(icons): (layerName, iconName) => HTMLImageElement | undefined`
  factory returning the `getImage` callback passed to `stylefunction`, resolving
  icon names produced by the converter.

### 3. Consume MapLibre style in OpenLayers — modify `olGeoJSONLayer.composable.ts`

- Extend the map `GeoJSONLayer` type (`packages/map/src/types/layers.ts`) with an
  optional `mapLibreStyle?` (mapbox-gl `Style`) field, **keeping** the existing
  `geoJsonStyle?` (geoadmin) field for side-by-side.
- In `setGeoJsonStyle()`: branch
  - if `layer.mapLibreStyle` is present → build source/features first, then call
    `stylefunction(olLayer, mapLibreStyle, sourceId, undefined, undefined, undefined,
undefined, getImage)` from `ol-mapbox-style`, with `getImage` from
    `maplibreShapeIcons`. (Verify exact arg positions against the installed v13 typings
    during implementation.)
  - else if `layer.geoJsonStyle` → existing legacy `OlStyleForPropertyValue` path
    (unchanged).
- No behaviour change for any current layer (mapLibreStyle is opt-in).

### 4. Dev-only test harness (local fixtures)

- Add fixtures under `packages/main/app/assets/poc/`:
  - `hydroweb-grundwasser.geojson` — a small FeatureCollection (a handful of points
    carrying `grundwasser-class` 1/2/3) in WGS84/LV95.
  - `hydroweb-grundwasser.geoadmin-style.json` — the real geoadmin `unique` style
    above.
- Add a button to the debug panel (`packages/main/app/components/debug/Panel.vue`,
  next to `ImportLocalLayersPanel`) → "Add MapLibre GeoJSON demo" that:
  1. loads the two fixtures,
  2. runs `geoadminToMapLibreStyle(...)`,
  3. constructs a map `GeoJSONLayer` with `geoJsonData` + `mapLibreStyle` populated,
  4. adds it via `mapViewStore.addLayerToTop(...)`.
- This drives `OpenLayersGeoJSONLayer.vue` → `useOlGeoJSONLayer` → the new
  `stylefunction` path.

### 5. Tests

- `packages/map/src/utils/geoadminToMapLibreStyle.spec.ts` — feed the hydroweb
  `unique` example; assert: one geojson source, three layers, correct `==` filters
  on `grundwasser-class`, circle paint for the circle value, symbol + icon spec for
  triangle/square, `icon-rotate` degrees from the radian rotations.
- Optional: a happy-dom test that `createShapeIcon` returns a canvas of expected size.

## Files

- NEW `packages/map/src/utils/geoadminToMapLibreStyle.ts`
- NEW `packages/map/src/utils/maplibreShapeIcons.ts`
- NEW `packages/map/src/utils/geoadminToMapLibreStyle.spec.ts`
- EDIT `packages/map/src/types/layers.ts` (add `mapLibreStyle?` to `GeoJSONLayer`)
- EDIT `packages/map/src/composables/olGeoJSONLayer.composable.ts` (branch to `stylefunction`)
- NEW `packages/main/app/assets/poc/hydroweb-grundwasser.geojson`
- NEW `packages/main/app/assets/poc/hydroweb-grundwasser.geoadmin-style.json`
- EDIT `packages/main/app/components/debug/Panel.vue` (+ small composable to build/inject the demo layer)

## Verification

1. Rebuild touched libs: `pnpm --filter @swissgeo/map build:dev` (then `shared` if its
   types changed), so `main` sees fresh dist.
2. `pnpm --filter @swissgeo/map test` — converter unit tests pass.
3. `pnpm type-check` and `pnpm lint`.
4. Manual: `pnpm build:dev:watch` + `pnpm dev`, open the debug panel, click
   "Add MapLibre GeoJSON demo", confirm the three point classes render as
   circle / triangle / square in geoadmin grey with white stroke and correct
   rotation — i.e. visually equivalent to the legacy literals styling.

## Known limitations

- **Draw order for polygon/line features now matches the legacy renderer** (fixes
  review finding C, e.g. `ch.bafu.hydroweb-warnkarte_national`). The converter collapses
  every polygon fill into one `fill` layer and every stroke (polygon outlines + line
  geometries) into one `line` layer, carrying the per-value differences as data-driven
  `["match"]` / `["case"]` paint expressions (polygon-vs-line disambiguated with
  `["geometry-type"]`). `ol-mapbox-style` assigns one z-index per MapLibre layer, so a
  single shared layer is drawn by OpenLayers in source order — exactly like the legacy
  `OlStyleForPropertyValue`, which drew every feature in one vector layer with no
  per-entry z-index. Previously each style entry became its own layer, so the last
  entries (e.g. the warnkarte region polygons) painted over everything.

- **Draw order for point features still groups by style entry.** Point entries stay one
  layer each because MapLibre cannot interleave `circle` and `symbol` layer types the
  way the legacy renderer interleaved per feature (`circle-sort-key` / `symbol-sort-key`
  only help _within_ a layer type). This is the residual case flagged in review as "not
  such an issue for point symbols" (e.g. `ch.bafu.hydroweb-messstationen_vorhersage`).
  MapLibre also always paints all `fill` below all `line` below all `symbol`, so a source
  order that interleaves _across_ geometry types cannot be reproduced 1:1. Accepted as a
  documented limitation for the POC.

## Out of scope (follow-ups)

- Removing the legacy `OlStyleForPropertyValue` (separate cleanup ticket).
- OGC GeoJSON record converter + `determineFormat` "ogc:geojson" support (records
  must point at MapLibre style files).
- Batch-converting all ~60 styles (the converter here is the reusable core a batch
  script would call).
