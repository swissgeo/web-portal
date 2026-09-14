import type { Dataset } from "@swissgeo/ogc";
import type { MaybeRefOrGetter } from "vue";

import { useDimensionsStore } from "@swissgeo/dimension";
import { makeServerLayer, useLayerStore } from "@swissgeo/layers";
import log from "@swissgeo/log";
import { toError } from "@swissgeo/shared";
import { toValue } from "vue";

/**
 * Puts a catalog dataset on the map, or takes it back off.
 *
 * TODO: use this in DatasetPanel.vue, pages/dataset/[id].vue and
 * useSearchSelection.ts, which add datasets to the map the same way, and in
 * LayerCartEntry.vue, which removes them the same way.
 */
export function useDatasetLayer(dataset: MaybeRefOrGetter<Dataset>) {
  const { t } = useI18n();
  const toast = useToast();
  const layerStore = useLayerStore();
  const dimensionsStore = useDimensionsStore();

  /**
   * The layer made from the dataset, once it is on the map. Layers are matched
   * on the record id they were made from.
   */
  const mapLayer = computed(() =>
    layerStore.layers.find((layer) => layer.humanId === toValue(dataset).id),
  );

  const isOnMap = computed(() => !!mapLayer.value);

  function addToMap(): void {
    try {
      layerStore.addLayer(makeServerLayer(toValue(dataset)));
    } catch (e) {
      log.error("Failed to add catalog layer to map", toError(e));
      toast.add({ color: "error", title: t("dataset.addToMapError") });
    }
  }

  function removeFromMap(): void {
    const layer = mapLayer.value;
    if (!layer) {
      return;
    }
    dimensionsStore.clearLayerDimensions(layer.uuid);
    // Removing the source layer unmounts its converter. The converter then
    // removes the matching layer from the map-view store.
    layerStore.removeLayer(layer.uuid);
  }

  return {
    isOnMap,
    addToMap,
    removeFromMap,
  };
}
