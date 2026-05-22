import type { Map } from "ol";
import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { computed, ref, watch } from "vue";

import type { GeoJSONLayer } from "@/types";

import useAddLayerToMap from "@/composables/useAddLayerToMap.composable";
import usePositionStore from "@/stores/position";

export default function useOlLocalGeoJSONLayer(
  layer: Ref<GeoJSONLayer>,
  olMap: Ref<Map | undefined> | undefined,
) {
  const positionStore = usePositionStore();

  const layerId = computed(() => layer.value.layerId);
  const zIndex = computed(() => layer.value.zIndex);
  const isVisible = computed(() => layer.value.isVisible);
  const opacity = computed(() => layer.value.opacity);
  const geoJsonData = computed(() => layer.value.geoJsonData);

  const olLayer = ref<VectorLayer>();

  watch(
    () => geoJsonData.value,
    () => {
      olLayer.value = new VectorLayer({
        properties: {
          id: layerId.value,
          uuid: layer.value.uuid,
        },
        opacity: opacity.value,
        style: new Style({
          fill: new Fill({
            color: "rgba(255, 0, 0, 0.2)",
          }),
          stroke: new Stroke({
            color: "#ff0000",
            width: 2,
          }),
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({
              color: "#ff0000",
            }),
          }),
        }),
      });
      initialize();
    },
    { immediate: true },
  );

  function setFeatures(): void {
    if (!geoJsonData.value) {
      log.error();
      log.error({
        title: "useOlGeoJSONLayer",
        titleColor: LogPreDefinedColor.Rose,
        messages: ["No GeoJSON data provided"],
      });
      return;
    }

    try {
      const features = new GeoJSON().readFeatures(geoJsonData, {
        dataProjection: "EPSG:4326",
        featureProjection: positionStore.projection.epsg,
      });

      if (olLayer.value) {
        olLayer.value.setSource(
          new VectorSource({
            features,
          }),
        );
      }

      log.debug({
        title: "useOlGeoJSONLayer",
        titleColor: LogPreDefinedColor.Rose,
        messages: [
          `Loaded ${features.length} features from local GeoJSON file`,
        ],
      });
    } catch (error) {
      log.error({
        title: "DrawingPanel/handleExport",
        titleColor: LogPreDefinedColor.Rose,
        messages: ["Failed to parse GeoJSON data:", error],
      });
      throw error;
    }
  }

  function initialize(): void {
    setFeatures();
  }

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
