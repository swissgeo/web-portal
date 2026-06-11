import type { Map } from "ol";
import type { FeatureLike } from "ol/Feature";
import type { Ref } from "vue";

import { constants as coordinateConstants } from "@swissgeo/coordinates";
import log, { LogPreDefinedColor } from "@swissgeo/log";
import { Feature } from "ol";
import { stylefunction } from "ol-mapbox-style";
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
import { makeGetImage } from "@/utils/maplibreShapeIcons";

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
  const mapLibreStyle = computed(() => layer.value.mapLibreStyle);

  const projection = computed(() => positionStore.projection);

  const olLayer = ref<VectorLayer>();

  watch(
    [
      () => geoJsonStyle.value,
      () => mapLibreStyle.value,
      () => geoJsonData.value,
    ],
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
    if (!olLayer.value) {
      return;
    }
    // Prefer the standard MapLibre style (rendered via ol-mapbox-style) when present.
    if (mapLibreStyle.value) {
      setMapLibreStyle();
      return;
    }
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

  function setMapLibreStyle(): void {
    if (!olLayer.value || !mapLibreStyle.value) {
      return;
    }
    const style = mapLibreStyle.value;
    // The converter emits a single geojson source; its key is what ties the style
    // layers to our OpenLayers VectorSource.
    const sourceId = Object.keys(style.sources)[0];
    if (!sourceId) {
      log.error({
        title: "useOlGeoJSONLayer",
        titleColor: LogPreDefinedColor.Yellow,
        messages: ["MapLibre style has no source", style],
      });
      return;
    }
    log.debug({
      title: "useOlGeoJSONLayer",
      titleColor: LogPreDefinedColor.Yellow,
      messages: ["Applying MapLibre style via ol-mapbox-style", style],
    });
    const getImage = makeGetImage(layer.value.mapLibreIcons ?? []);
    // Pass the LV95 view resolutions so ol-mapbox-style maps the current map
    // resolution to the same zoom levels the converter used for minzoom/maxzoom.
    stylefunction(
      olLayer.value,
      style,
      sourceId,
      coordinateConstants.LV95_RESOLUTIONS,
      undefined,
      undefined,
      undefined,
      getImage,
    );
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
    // Features first, then style: ol-mapbox-style's stylefunction reads the source's
    // features at render time, and the legacy path is unaffected by ordering.
    setFeatures();
    setGeoJsonStyle();
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
