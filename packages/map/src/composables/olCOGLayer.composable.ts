import type { Map } from "ol";
import type GeoTIFFSourceType from "ol/source/GeoTIFF";
import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import WebGLTileLayer from "ol/layer/WebGLTile";
import { computed, shallowRef, watch } from "vue";

import type { COGLayer } from "#types/index";

import useAddLayerToMap from "#composables/useAddLayerToMap.composable";

// Loaded on first use instead of with the rest of this package: geotiff pulls in
// web-worker, which throws when imported inside a Node worker thread (where Nuxt
// dev renders the server side), and only COG layers need it.
let geoTIFFSourceClass: Promise<typeof GeoTIFFSourceType> | undefined;
function loadGeoTIFFSource(): Promise<typeof GeoTIFFSourceType> {
  geoTIFFSourceClass ??= import("ol/source/GeoTIFF").then(
    (module) => module.default,
  );
  return geoTIFFSourceClass;
}

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

  // bumped on every change, so a slower earlier load can't overwrite a newer layer
  let sourceVersion = 0;

  watch(
    [cogUrl, cogBlob],
    async () => {
      const version = ++sourceVersion;
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

      const GeoTIFFSource = await loadGeoTIFFSource();
      if (version !== sourceVersion) {
        return;
      }

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
