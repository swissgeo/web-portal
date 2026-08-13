<script setup lang="ts">
import type { Dimension } from "@swissgeo/dimension";
import type {
  DatasetLayer,
  LayerInfo,
  Layer as SourceData,
} from "@swissgeo/layers";
import type { Layer as MapLayer } from "@swissgeo/map";
import type { Dataset, Legend } from "@swissgeo/ogc";

import {
  convertYearToTimestamp,
  getYearFromGeoadminValue,
  useDimensionsStore,
} from "@swissgeo/dimension";
import { isDatasetLayer, useLayerStore } from "@swissgeo/layers";
import log from "@swissgeo/log";

import MapDatamappingFileConverter from "@/components/map/datamapping/FileConverter.vue";
import LayerLoadErrorBoundary from "@/components/map/datamapping/LayerLoadErrorBoundary.vue";
import MapDatamappingOgcDatasetConverter from "@/components/map/datamapping/OgcDatasetConverter.vue";

const { t } = useI18n();
const toaster = useToaster();

const { sourceBgLayer, sourceData } = defineProps<{
  sourceBgLayer: SourceData | null | undefined;
  sourceData: SourceData[];
}>();

const mapViewStore = useMapViewStore();
const layerStore = useLayerStore();
const dimensionsStore = useDimensionsStore();

// there can be multiple calls to this function, and the options consumes themselves
// on call, so we consume the options first, then we give it the current data if there is
// some, and at last we revert to the default value only if there is no data and no options
function updateMapLayerData(index: number, mapLayerData: MapLayer) {
  const options = layerStore.consumeImportOptions(mapLayerData.uuid);
  const currentData = mapViewStore.getMapLayers().value[index];

  mapLayerData.opacity =
    options?.opacity ?? currentData?.opacity ?? mapLayerData.opacity;
  mapLayerData.isVisible = options?.isVisible ?? currentData?.isVisible ?? true;

  mapViewStore.updateLayerData(index, mapLayerData, true);
}

function updateBgLayer(mapLayerData: MapLayer | null) {
  if (!mapLayerData) {
    return;
  }

  mapLayerData.opacity = 1;
  /**
   * If the first layer in the map view store can be found in the source layers,
   * this means this is not a background layer, which means the previous background layer
   * is null, and thus we can simply unshift the background layer
   *
   * Otherwise, we replace the background layer
   */
  const currentDataUuid = mapViewStore.mapLayers[0]?.uuid;
  if (
    layerStore.getLayer(`${currentDataUuid}`) &&
    layerStore.backgroundLayer?.uuid !== currentDataUuid
  ) {
    mapViewStore.mapLayers.unshift(mapLayerData);
  } else {
    updateMapLayerData(0, mapLayerData);
  }
}
function updateLayerInfo(uuid: string, info: LayerInfo) {
  layerStore.setLayerInfo(uuid, info);
}

function updateLegends(uuid: string, legends: Legend[]) {
  mapViewStore.setLayerLegends(uuid, legends);
}

function updateStoreLayerData(uuid: string, dataset: Dataset) {
  layerStore.setLayerData(uuid, dataset);
}

function updateTimeDimension(uuid: string, dimension: Partial<Dimension>) {
  const existingCurrentValue =
    dimensionsStore.getDimensions(uuid)?.time?.currentValue;
  const existingYear = existingCurrentValue
    ? getYearFromGeoadminValue(existingCurrentValue)
    : undefined;
  const matchedValue =
    existingYear && dimension.availableValues?.length
      ? convertYearToTimestamp(
          dimension.availableValues,
          parseInt(existingYear),
        )
      : undefined;

  // When capabilities are refreshed the incoming dimension may carry a
  // different currentValue. If the store already holds a value, we extract
  // its year and find the matching entry in the new availableValues so the
  // user's previously-selected year is preserved across capability refreshes.
  // matchedValue intentionally overrides dimension.currentValue when found.
  dimensionsStore.setDimension(uuid, "time", {
    ...dimension,
    ...(matchedValue ? { currentValue: matchedValue } : {}),
  });
}

function removeMapLayer(uuidToRemove: string) {
  if (mapViewStore.mapLayers.some((layer) => layer.uuid === uuidToRemove)) {
    mapViewStore.removeLayer(uuidToRemove);
  }
}

function handleLayerError(layer: SourceData, error: unknown) {
  const cause = error instanceof Error ? error.cause : undefined;
  log.error({
    title: "Layer load failed",
    messages:
      cause === undefined ? [layer.uuid, error] : [layer.uuid, error, cause],
  });
  toaster.showError(t("error.layerLoad"));

  dimensionsStore.clearLayerDimensions(layer.uuid);
  layerStore.clearImportOptions(layer.uuid);
  removeMapLayer(layer.uuid);

  if (layerStore.backgroundLayer?.uuid === layer.uuid) {
    layerStore.setBackground(null);
  } else {
    layerStore.removeLayer(layer.uuid);
  }
}
</script>

<template>
  <LayerLoadErrorBoundary
    v-if="sourceBgLayer && isDatasetLayer(sourceBgLayer)"
    :key="sourceBgLayer.uuid"
    @error="handleLayerError(sourceBgLayer, $event)"
  >
    <MapDatamappingOgcDatasetConverter
      :layer="sourceBgLayer as DatasetLayer"
      @error="handleLayerError(sourceBgLayer, $event)"
      @update="updateBgLayer($event)"
      @updateDataset="updateStoreLayerData"
      @updateLayerInfo="updateLayerInfo"
      @remove="removeMapLayer"
    />
  </LayerLoadErrorBoundary>

  <LayerLoadErrorBoundary
    v-for="(data, index) in sourceData.filter((data) => !!data)"
    :key="data.uuid"
    @error="handleLayerError(data, $event)"
  >
    <MapDatamappingOgcDatasetConverter
      v-if="isDatasetLayer(data)"
      :layer="data"
      @error="handleLayerError(data, $event)"
      @update="updateMapLayerData(index + Number(!!sourceBgLayer), $event)"
      @updateTimeDimension="updateTimeDimension"
      @updateDataset="updateStoreLayerData"
      @updateLayerInfo="updateLayerInfo"
      @updateLegends="updateLegends"
    />
    <MapDatamappingFileConverter
      v-else
      :layer="data"
      @update="updateMapLayerData(index + Number(!!sourceBgLayer), $event)"
    />
  </LayerLoadErrorBoundary>
</template>
