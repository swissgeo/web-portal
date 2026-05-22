import type { Map } from "ol";
import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { Tile as TileLayer } from "ol/layer";
import WMTS from "ol/source/WMTS";
import { computed, ref, watch, watchEffect } from "vue";

import type { WMTSLayer } from "@/types/layers";

import useAddLayerToMap from "@/composables/useAddLayerToMap.composable";

/** Tying a layer object from the app to a openlayers object */
export default function useOlWmtsLayer(
  layer: Ref<WMTSLayer>,
  olMap: Ref<Map | undefined> | undefined,
) {
  const olLayer = ref<TileLayer>();
  const source = ref<WMTS>();

  const layerId = computed(() => layer.value.layerId);
  const zIndex = computed(() => layer.value.zIndex);
  const isVisible = computed(() => layer.value.isVisible);
  const opacity = computed(() => layer.value.opacity);
  const dimension = computed(() => layer.value.dimensions);

  const initialTimestamp = computed(
    () => dimension.value?.time?.currentValue || "current",
  );
  // const initialTimestamp = ref('current')

  const wmtsTimeConfig = computed(() => {
    return getTimeConfig(initialTimestamp.value);
  });

  // only when the options change we want to update the objects here
  // that's why we're not using computed
  watch(
    () => layer.value.options,
    () => {
      if (!layer.value.options) {
        return;
      }
      olLayer.value = new TileLayer({
        properties: {
          id: layerId.value,
          uuid: layer.value.uuid,
        },
        opacity: layer.value.opacity,
      });

      const definitiveOptions = {
        ...layer.value.options,
        ...wmtsTimeConfig.value,
      };

      log.debug({
        title: "olWmtsLayer",
        titleColor: LogPreDefinedColor.Green,
        messages: [
          `Set WMTS source for layer ${layer.value.layerId} with options`,
          definitiveOptions,
        ],
      });

      source.value = new WMTS(definitiveOptions);
      olLayer.value.setSource(source.value);
    },
    { immediate: true },
  );

  const { addLayerToMap } = useAddLayerToMap(
    olLayer,
    zIndex,
    isVisible,
    opacity,
    olMap,
  );

  watch(
    () => olLayer.value,
    () => {
      addLayerToMap();
    },
  );

  watchEffect(() => {
    if (dimension.value?.time?.currentValue) {
      updateTimeDimension(dimension.value?.time?.currentValue);
    }
  });

  function getTimeConfig(timestamp: string | null) {
    return { dimensions: { Time: timestamp ?? "current" } };
  }

  function updateTimeDimension(newTimestamp: string) {
    if (!source.value) {
      log.warn(
        `Cannot update time dimension for ${layerId.value}: source not initialized yet`,
      );
      return;
    }
    log.debug(`Updating the time for ${layerId.value} to ${newTimestamp}`);
    const timeConfig = getTimeConfig(newTimestamp);
    source.value.updateDimensions(timeConfig.dimensions);
  }

  return {
    /*updateTimeDimension*/
  };
}
