import type { Map } from "ol";
import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import WebGLTileLayer from "ol/layer/WebGLTile";
import GeoTIFFSource from "ol/source/GeoTIFF";
import { computed, shallowRef, watch } from "vue";

import type { COGLayer } from "@/types";

import useAddLayerToMap from "@/composables/useAddLayerToMap.composable";

export default function useOlCOGLayer(
  layer: Ref<COGLayer>,
  olMap: Ref<Map | undefined> | undefined,
) {
  const layerId = computed(() => layer.value.layerId);
  const zIndex = computed(() => layer.value.zIndex);
  const isVisible = computed(() => layer.value.isVisible);
  const opacity = computed(() => layer.value.opacity);
  const cogUrl = computed(() => layer.value.url);
  const cogBlob = computed(() => layer.value.blob);

  const olLayer = shallowRef<WebGLTileLayer>();

  watch(
    [cogUrl, cogBlob],
    () => {
      const sourceConfig = cogBlob.value
        ? { blob: cogBlob.value }
        : cogUrl.value
          ? { url: cogUrl.value }
          : null;

      if (!sourceConfig) {
        return;
      }

      log.debug({
        title: "useOlCOGLayer",
        titleColor: LogPreDefinedColor.Cyan,
        messages: [`Initializing COG layer ${layerId.value}`],
      });

      const source = new GeoTIFFSource({
        sources: [sourceConfig],
        convertToRGB: "auto",
      });

      olLayer.value = new WebGLTileLayer({
        properties: {
          id: layerId.value,
          uuid: layer.value.uuid,
        },
        source,
        opacity: opacity.value,
      });
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
    { immediate: true },
  );

  return {};
}
