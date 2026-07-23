# swissgeo/feature

Standalone feature-identification pipeline for the swissgeo web-portal. Pure data package: types, store, strategy registry, identify orchestration. No UI, no OpenLayers, no DOMPurify.

## Intention

When a user clicks a map layer, the orchestrator is given the click coordinate, the visible layers, and any pre-resolved vector features. The orchestrator dispatches to a per-layer-type `IdentifyStrategy` (HTTP for raster layers, the pre-resolved features for vector layers), accumulates the results in `featureStore`, and the rest of the app (popover, highlight) reacts to the store.

This package owns the **data pipeline**. The map-click event, the on-map highlight, and the popover UI all live elsewhere (`@swissgeo/map` and `main` respectively). See `../../docs/spec/web-portal/GPS-531-feature-info-module.md` for the full architecture.

## Package boundaries

This package imports **no other swissgeo domain package** and **no `ol`/`proj4`/`dompurify`**. Allowed dependencies:

- `@swissgeo/log`, `@swissgeo/shared` (leaf utilities)
- `pinia`, `vue` (peer)

Data flow: `main → feature → main`. `feature` and `map` never communicate directly.

## Public surface

- Types: `IdentifiableLayer`, `IdentifyRequest`, `FeatureData`, `IdentifyStrategy`, `LayerType`, `Projection`, `NotImplemented`
- Constants: `IDENTIFY_TOLERANCE_PX`, `FEATURE_LIMIT`
- Store: `useFeatureStore`
- Orchestration: `identify()`
- Registry: `StrategyRegistry`, `createDefaultRegistry()`
- Stubs (v1): `GeoAdminApi3Strategy`, `ExternalWmsStrategy`, `ClientVectorStrategy` — all throw `NotImplemented`

See `src/index.ts` for the full barrel.

## v1 status

Strategies ship as stubs that throw `NotImplemented`. Replacing a stub with a real implementation is a Phase 2 ticket per strategy. See the master spec.
