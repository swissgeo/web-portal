import type { Map } from "ol";
import type { FeatureLike } from "ol/Feature";
import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { Feature } from "ol";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import { register } from "ol/proj/proj4";
import VectorSource from "ol/source/Vector";
import proj4 from "proj4";
import { computed, ref, watch } from "vue";

import type { GeoJSONLayer } from "@/types";
import type { GeoAdminGeoJSONStyleDefinition } from "@/utils/geojson";

import useAddLayerToMap from "@/composables/useAddLayerToMap.composable";
import usePositionStore from "@/stores/position";
import * as geoJsonUtils from "@/utils/geoJsonUtils";

import OlStyleForPropertyValue from "../utils/geoJsonStyleFromLiterals";

export default function useOlGeoJSONLayer(
  layer: Ref<GeoJSONLayer>,
  olMap: Ref<Map | undefined> | undefined,
) {
  const positionStore = usePositionStore();
  const layerId = computed(() => layer.value.layerId);
  const zIndex = computed(() => layer.value.zIndex);
  const isVisible = computed(() => layer.value.isVisible);
  const opacity = computed(() => layer.value.opacity);
  const geoJsonData = computed(() => layer.value.geoJsonData);
  const geoJsonStyle = computed(() => layer.value.geoJsonStyle);

  const projection = computed(() => positionStore.projection);

  const olLayer = ref<VectorLayer>();

  watch(
    [() => geoJsonStyle.value, () => geoJsonData.value],
    () => {
      olLayer.value = new VectorLayer({
        properties: {
          id: layerId.value,
          uuid: layer.value.uuid,
        },
        opacity: opacity.value,
      });

      initialize();
    },
    { immediate: true },
  );

  function setGeoJsonStyle(): void {
    if (!geoJsonStyle.value) {
      return;
    }
    log.debug({
      title: "useOlGeoJSONLayer",
      titleColor: LogPreDefinedColor.Yellow,
      messages: ["Setting geoJSON style", geoJsonStyle.value],
    });
    const styleFunction = new OlStyleForPropertyValue(
      geoJsonStyle.value as GeoAdminGeoJSONStyleDefinition,
    );

    if (olLayer.value) {
      olLayer.value.setStyle((feature: FeatureLike, res) => {
        // OpenLayers passes FeatureLike, but our style function expects Feature
        // RenderFeature doesn't have the same methods as Feature, so we need to handle this
        if (feature instanceof Feature) {
          return styleFunction.getFeatureStyle(feature, res);
        }
        // For RenderFeature, return a default style or handle differently
        return styleFunction.defaultStyle;
      });
    }
  }

  function setFeatures(): void {
    if (!olLayer.value) {
      return;
    }

    log.debug({
      title: "useOlGeoJSONLayer",
      titleColor: LogPreDefinedColor.Yellow,
      messages: ["Setting geoJSON source", geoJsonData.value],
    });

    olLayer.value.setSource(
      new VectorSource({
        features: new GeoJSON().readFeatures(
          geoJsonUtils.reprojectGeoJsonData(
            geoJsonData.value,
            projection.value,
          ),
        ),
      }),
    );
  }

  function initialize(): void {
    register(proj4);
    setGeoJsonStyle();
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
