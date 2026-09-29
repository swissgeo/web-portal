# swissgeo/feature

This is a standalone feature identification pipeline package designed for the swissgeo web portal. Its purely data driven and is designed to be framework-agnostic regarding map rendering frameworks.

## Intention

When a user clicks on the map, the module receives the coordinates, the necessary layer information, and any pre-existing vector features (for example: GeoJSON layers).
Then, one of those cases might occur:

- This is a layer with pre-existing vector features, which means we pass them on to the module's store.
- This is a layer within our ogc records, which means we follow the guidelines from the record, which can result in either using the WMS server response, or the identify API response
- This is a pure WMS layer, in which case we use the capabilities and the `GetFeatureInfo` endpoint
- There are no features to fetch.

Once we have these information, they are aggregated in the store so that the main module can fetch this data and provide a popup to the user.

This package owns the **data pipeline**. It receives data during layer initialization and when a click happens, but it is not handling any of those steps. It only converts a query to data we can show and store it.

## Package boundaries

This package imports **no other swissgeo domain package** and **no `ol`/`proj4`/`dompurify`**. Allowed dependencies:

- `@swissgeo/log`, `@swissgeo/shared` (leaf utilities)
- `pinia`, `vue` (peer)

Data flow: `main → feature → main`. `feature` and `map` never communicate directly.

Concordance between layers and attributes is done using the layers `uuid` attribute, like in the `dimension` package, for example.

## Public surface

from `index.ts`

```typescript
export type {
  LayerRequest,
  LayerSource,
  FeatureData,
  OgcDistribution,
  OgcDistributionFeature,
  WmsFeatureInfoCapability,
} from "@/types";
export * from "@/constants";
export {
  sourceToLayerRequest,
  isIdentifyFeatureInfo,
} from "@/utils/sourceToLayerRequest";
export {
  selectFeatures,
  createIdentifyResponse,
  getPopupFromIdentifyFeature,
} from "@/selectFeatures";
export { useFeaturesStore } from "@/stores/feature";
```

from the `store`

```typescript
return {
    selectedFeaturesByUuid,
    wmsCapabilitiesByUuid,
    // GETTERS
    getFeaturesGeoJSON,
    getShareableFeaturesIdsByUuid,
    hasSelectedFeatures,
    // ACTIONS
    addSelection,
    addFeaturePreselection,
    consumeFeaturePreselection,
    setSelection,
    $reset,
    getWmsCapability,
    setWmsCapability,
    clearWmsCapability,
  }
```
