<script lang="ts" setup>
import type { LayerSource } from "@swissgeo/feature";
import type { Layer as SourceLayer } from "@swissgeo/layers";
import type {
  HighLightLayer,
  Layer as MapLayer,
  MapClickEvent,
  MapLayerRenderer,
} from "@swissgeo/map";
import type { MapLibreStyleDocument } from "@swissgeo/shared";
import type { DisplayMode } from "~/types/injectionKeys";

import { useDimensionsStore } from "@swissgeo/dimension";
import {
  selectFeatures,
  useFeaturesStore,
  FEATURE_LIMIT,
} from "@swissgeo/feature";
import { isDatasetLayer, useLayerStore } from "@swissgeo/layers";
import log from "@swissgeo/log";
import { MapModule, usePositionStore } from "@swissgeo/map";
import { HIGHLIGHT_LAYER_ID, toRgbaColor } from "@swissgeo/shared";
import { cloneDeep } from "es-toolkit";

import SourceToMapDataConverter from "@/components/SourceToMapDataConverter.vue";
import { readThemeToken } from "@/utils/themeTokens";

const { isEnabled } = useFeatureFlags();

const {
  displayMode = "web",
  compareSliderActive,
  compareRatio,
  compareSliderClippedLayer,
  zoomOnlyCtrl = false,
} = defineProps<{
  displayMode?: DisplayMode;
  compareSliderActive?: boolean;
  compareRatio?: number;
  compareSliderClippedLayer?: Pick<
    MapLayer,
    "layerId" | "uuid" | "displayName"
  >;
  zoomOnlyCtrl?: boolean;
}>();

const emit = defineEmits<{
  "update:compareRatio": [ratio: number];
}>();

const HIGHLIGHT_LAYER_STROKE_WIDTH = 3;
const HIGHLIGHT_LAYER_CIRCLE_RADIUS = 7;

const layerStore = useLayerStore();
const mapViewStore = useMapViewStore();
const dimensionsStore = useDimensionsStore();
const positionStore = usePositionStore();
const toolboxStore = useToolboxStore();
const toaster = useToaster();
const { t, locale } = useI18n();
const featureStore = useFeaturesStore();

const sourceLayers = computed(() => layerStore.layers);
const backgroundLayer = computed(() => layerStore.backgroundLayer);

// Highlight colors come from the design tokens
// Fallbacks mirror the current pallet at time of implementation.

// If we ever need the `readThemeToken` function elsewhere, we could create a small function
// which takes a decimal percentage as input, and append the corresponding alpha channel to the
// color
const highlightStroke = toRgbaColor(
  readThemeToken("--ui-color-primary-600", "#06999b"),
  1,
);
// we're adding an alpha channel at the end
const highlightFill = toRgbaColor(
  readThemeToken("--ui-color-secondary-500", "#06999b"),
  0.59,
);

const highlightGeoJSONLayer: ComputedRef<HighLightLayer> = computed(() => {
  // Inline MapLibre style for selected features (previously a geoadmin
  // literals definition): a filled circle for points, a stroke for lines and
  // polygon outlines, and a fill for polygons.
  const mapLibreStyle: MapLibreStyleDocument = {
    version: 8,
    sources: {
      [HIGHLIGHT_LAYER_ID]: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      },
    },
    layers: [
      {
        id: `${HIGHLIGHT_LAYER_ID}-circle`,
        type: "circle",
        source: HIGHLIGHT_LAYER_ID,
        paint: {
          "circle-radius": HIGHLIGHT_LAYER_CIRCLE_RADIUS,
          "circle-color": highlightFill,
          "circle-stroke-color": highlightStroke,
          "circle-stroke-width": HIGHLIGHT_LAYER_STROKE_WIDTH,
        },
      },
      {
        id: `${HIGHLIGHT_LAYER_ID}-fill`,
        type: "fill",
        source: HIGHLIGHT_LAYER_ID,
        paint: {
          "fill-color": highlightFill,
        },
      },
      {
        id: `${HIGHLIGHT_LAYER_ID}-line`,
        type: "line",
        source: HIGHLIGHT_LAYER_ID,
        paint: {
          "line-color": highlightStroke,
          "line-width": HIGHLIGHT_LAYER_STROKE_WIDTH,
        },
      },
    ],
  };
  return {
    uuid: HIGHLIGHT_LAYER_ID,
    opacity: 1,
    isVisible: true,
    layerId: HIGHLIGHT_LAYER_ID,
    format: "GeoJSON",
    isSystemLayer: true,
    geoJsonData: {
      ...featureStore.getFeaturesGeoJSON,
      crs: {
        type: "name",
        properties: {
          name: positionStore.projectionEpsg,
        },
      },
    },
    mapLibreStyle,
  };
});

const layersForMap = computed(() => {
  const layers = mapViewStore.getMapLayers().value.map((layer) => {
    /**
     * We have a small issue. The conversion pipeline consume options, or sets the
     * default opacity to what the OGC records style tells us. If we try to set
     * the opacity to 1 there, we encounter situations where this opacity is set
     * before the default style is applied, and thus we couldn't be certain if the
     * opacity was due to previous options and should be kept, or to a default temporary
     * value and should be discarded.
     *
     * Now, this conversion pipeline do not set a "default" application value, and
     * instead it is done by this computed. We use a clone when there is a need to set the
     * opacity to avoid modifying the original layer, and we do not use clones otherwise to avoid
     * generating unnecessary objects (also, this was creating some flickering)
     *
     */
    if (layer && (layer.opacity === null || layer.opacity === undefined)) {
      if (layer.uuid === backgroundLayer.value?.uuid) {
        layer.opacity = 1;
        return layer;
      }
      const clonedLayer = cloneDeep(layer);
      clonedLayer.opacity = 1;
      return clonedLayer;
    }
    return layer;
  });
  if (featureStore.hasSelectedFeatures && displayMode !== "print") {
    layers.push(highlightGeoJSONLayer.value);
  }
  return layers;
});
const customLayerRenderers: MapLayerRenderer[] = [];

function handleLayerError(uuid: SourceLayer["uuid"], error: Error) {
  const { cause } = error;
  log.error({
    title: "Layer load failed",
    messages: cause === undefined ? [uuid, error] : [uuid, error, cause],
  });
  toaster.showError(t("error.layerLoad"));

  dimensionsStore.clearLayerDimensions(uuid);
  featureStore.clearWmsCapability(uuid);
  layerStore.clearImportOptions(uuid);

  mapViewStore.removeLayer(uuid);

  if (layerStore.backgroundLayer?.uuid === uuid) {
    layerStore.setBackground(null);
  } else {
    layerStore.removeLayer(uuid);
  }
}

let abortController: AbortController | null = null;

const POPOVER_ESTIMATED_WIDTH = 240;
const POPOVER_ESTIMATED_HEIGHT = 80;

const featureInfoDisabledPosition = ref({ x: 200, y: 200 });

function updateFeatureInfoDisabledPosition(pixel: MapClickEvent["pixel"]) {
  const mapElement = document.querySelector<HTMLElement>(
    '[data-testid="ol-map"]',
  );
  const rect = mapElement?.getBoundingClientRect();
  featureInfoDisabledPosition.value = {
    x: Math.min(
      (rect?.left ?? 0) + pixel[0],
      window.innerWidth - POPOVER_ESTIMATED_WIDTH,
    ),
    y: Math.min(
      (rect?.top ?? 0) + pixel[1],
      window.innerHeight - POPOVER_ESTIMATED_HEIGHT,
    ),
  };
}

async function handleMapClickEvent(mapClickEvent: MapClickEvent) {
  featureStore.$reset();
  if (toolboxStore.isDrawingActive()) {
    return;
  }
  updateFeatureInfoDisabledPosition(mapClickEvent.pixel);
  abortController?.abort();
  abortController = new AbortController();
  const { signal } = abortController;

  const layersSources: LayerSource[] = [];

  const filterOutCutLayer =
    compareSliderActive &&
    mapClickEvent.pixel[0] >
      (compareRatio ?? 0) * mapClickEvent.viewportSize[0];
  const results: LayerSource[] = sourceLayers.value
    .filter((sourceLayer) => {
      const mapLayer = mapViewStore.getMapLayerFromUuid(sourceLayer.uuid);
      return (
        // first we filter out hidden layers
        mapLayer?.isVisible &&
        // at startup, some layers will have a nullish opacity, which is interpreted
        // as `1` in the mapviewer (by default, we want to see the map).
        (mapLayer.opacity ?? 1) > 0 &&
        // we also filter the compare slider clipped layer if the click happened
        // on the right of the slider
        !(
          filterOutCutLayer &&
          compareSliderClippedLayer?.uuid === sourceLayer.uuid
        )
      );
    })
    .map((sourceLayer) => {
      const preResolvedFeatures =
        mapClickEvent.vectorFeaturesPerLayer[sourceLayer.uuid];
      // we spare some fetches if the features are already there
      const layerSource: LayerSource = {
        layerUuid: sourceLayer.uuid,
        layerId: isDatasetLayer(sourceLayer)
          ? sourceLayer.data.id
          : sourceLayer.humanId,
        getFeatureInfoInformation: isDatasetLayer(sourceLayer)
          ? sourceLayer.info?.featureInfoInformation
          : undefined,
        preResolvedFeatures,
        layerName:
          featureStore.getWmsCapability(sourceLayer.uuid)?.layerName ?? null,
      };
      return layerSource;
    });

  results.forEach((result) => {
    layersSources.push(result);
  });

  if (signal.aborted) {
    return;
  }
  await selectFeatures(
    mapClickEvent.extent,
    positionStore.projection.epsgNumber,
    locale.value.toLowerCase(),
    layersSources,
    FEATURE_LIMIT,
    signal,
  );
}
</script>

<template>
  <ClientOnly>
    <slot name="before" />
    <SourceToMapDataConverter
      :source-bg-layer="backgroundLayer"
      :source-data="sourceLayers"
      @layer-error="handleLayerError"
    />
    <MapModule
      :layers="layersForMap"
      :custom-layer-renderers="customLayerRenderers"
      :display-mode="displayMode"
      :compare-slider-active="compareSliderActive"
      :compare-ratio="compareRatio"
      :compare-slider-clipped-layer="compareSliderClippedLayer"
      :zoom-only-ctrl="zoomOnlyCtrl"
      class="h-full w-full"
      @layer-error="handleLayerError"
      @update:compare-ratio="emit('update:compareRatio', $event)"
      @map-click="handleMapClickEvent"
    >
      <template
        v-if="$slots['context-menu-popup']"
        #context-menu-popup="slotProps"
      >
        <slot name="context-menu-popup" v-bind="slotProps" />
      </template>
      <slot name="map-ui" />
    </MapModule>
    <FeaturesinfoFeatureInfoPopover
      v-if="
        displayMode !== 'print' &&
        featureStore.hasSelectedFeatures &&
        isEnabled('enableFeatureInfo')
      "
      @close="featureStore.$reset()"
    />
    <FeaturesinfoFeatureInfoDisabled
      v-else-if="displayMode !== 'print' && featureStore.hasSelectedFeatures"
      :initial-position="featureInfoDisabledPosition"
    />
    <Toolbox v-if="displayMode !== 'print'" />
    <slot name="after" />
  </ClientOnly>
</template>
