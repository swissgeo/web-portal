<script setup lang="ts">
import type { DatasetLayer, Dimension, LayerInfo } from "@swissgeo/layers";
import type { Layer as MapLayer } from "@swissgeo/map";
import type { Dataset } from "@swissgeo/ogc";
import type { Options as WMTSOptions } from "ol/source/WMTS";

/**
 * Dataset Layer Converter Container
 *
 * This is a sort of container component that is used to trigger the data fetching
 * from the OGC records.
 * This code maps the data from the layer store to the data structure needed by the
 * map module. The intermediate conversion is basically the traversal of the OGC dataset that
 * is being provided.
 *
 * Some notes on how all this is structured:
 * - We use the useGenericOgcData composable that contains the needed code to traverse the part
 *   of the OGC records that is generic for all the records
 * - Based on the inferred type of display, we also render the sub converters, see the template below
 * - The sub-converters ultimately deliver the data needed for openlayers to display the data
 * - The data from the sub-converter as well as some incoming data are together being merged into one object
 *   and the parent is informed about the changes
 */
import type { WMSLayerData } from "./useOgcWmsData";

import useDatasetLocaleRefresh from "./useDatasetLocaleRefresh";
import { useGenericOgcData } from "./useGenericOgcData";

const { layer } = defineProps<{
  layer: DatasetLayer;
}>();

const emit = defineEmits<{
  update: [layer: MapLayer];
  updateTimeDimension: [layerUuid: string, dimension: Partial<Dimension>];
  updateOpacity: [layerUuid: string, opacity: number];
  remove: [void];
  updateDataset: [layerUuid: string, dataset: Dataset];
  updateLayerInfo: [layerUuid: string, info: LayerInfo];
}>();

const { layerFormat, distribution, serviceData, layerId } = useGenericOgcData(
  computed(() => layer),
);

// Registering composable that will ensure that a dataset is refreshed when the locale changes.
// useDatasetLocaleRefresh throws if the dataset has no "self" link (e.g. a malformed OGC record);
// catch it here so a single broken layer cannot abort the whole converter setup, and surface it
// to the user via a toast.
try {
  useDatasetLocaleRefresh(
    layer,
    (...args) => emit("updateDataset", ...args),
    (...args) => emit("updateLayerInfo", ...args),
  );
} catch (error) {
  const toaster = useToaster();
  toaster.showError(error instanceof Error ? error.message : String(error));
}

// holds the data that's specific for the layers from the sub mappers
const layerSpecificData = ref();

/**
 * Reactively merge the data from the store as well as the
 * data from the OGC records
 */
const layerData = computed((): MapLayer => {
  return {
    layerId: layerId.value,
    format: layerFormat.value,
    uuid: layer.uuid,

    ...layerSpecificData.value,

    // some data we pass directly from the original, so when it's updated
    // the change will be reflected in the data that the map receives
    dimensions: layer.dimensions ?? null,
    displayName: layer.info?.displayName ?? layer.humanId,
  };
});

// trigger the update to the parent
watch(layerData, () => emit("update", layerData.value), { immediate: true });

onBeforeUnmount(() => {
  emit("remove");
});

// receive the layer specific data from the subconverters
function pushLayerSpecificData<T>(data: T) {
  layerSpecificData.value = data;
}
</script>

<template>
  <MapDatamappingOgcWmtsLayerConverter
    v-if="layerFormat === 'WMTS'"
    :distribution
    :serviceData
    :layerId
    @updateOptions="pushLayerSpecificData<{ options: WMTSOptions }>"
    @updateTimeDimension="emit('updateTimeDimension', layer.uuid, $event)"
    @updateOpacity="emit('updateOpacity', layer.uuid, $event)"
  ></MapDatamappingOgcWmtsLayerConverter>
  <MapDatamappingOgcWmsLayerConverter
    v-if="layerFormat === 'WMS'"
    :distribution
    :serviceData
    :layerId
    @updateData="pushLayerSpecificData<WMSLayerData>"
    @updateTimeDimension="emit('updateTimeDimension', layer.uuid, $event)"
    @updateOpacity="emit('updateOpacity', layer.uuid, $event)"
  ></MapDatamappingOgcWmsLayerConverter>
</template>
