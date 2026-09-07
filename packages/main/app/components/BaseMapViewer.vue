<script lang="ts" setup>
import type { LayerSource, OgcDistribution } from "@swissgeo/feature";
import type { Layer as SourceLayer } from "@swissgeo/layers";
import type {
  GeoAdminGeoJSONStyleDefinition,
  HighLightLayer,
  Layer as MapLayer,
  MapClickEvent,
  MapLayerRenderer,
} from "@swissgeo/map";
import type { DisplayMode } from "~/types/injectionKeys";

import { useDimensionsStore } from "@swissgeo/dimension";
import log from "@swissgeo/log";
import {
  selectFeatures,
  useFeaturesStore,
  FEATURE_LIMIT,
} from "@swissgeo/feature";
import { useLayerStore } from "@swissgeo/layers";
import { MapModule, usePositionStore } from "@swissgeo/map";
import { HIGHLIGHT_LAYER_ID } from "@swissgeo/shared";
import { cloneDeep } from "es-toolkit";

import SourceToMapDataConverter from "@/components/SourceToMapDataConverter.vue";
import { readThemeToken } from "@/utils/themeTokens";

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

const layerStore = useLayerStore();
const mapViewStore = useMapViewStore();
const dimensionsStore = useDimensionsStore();
const positionStore = usePositionStore();
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
const highlightStroke = readThemeToken("--ui-color-primary-600", "#06999b");
// we're adding an alpha channel at the end
const highlightFill = `${readThemeToken("--ui-color-secondary-500", "#06999b")}59`;

const highlightGeoJSONLayer: ComputedRef<HighLightLayer> = computed(() => {
  const geoJsonStyle: GeoAdminGeoJSONStyleDefinition = {
    type: "single",
    property: "featureId",
    geomType: "polygon",
    vectorOptions: {
      type: "circle",
      fill: {
        color: highlightFill,
      },
      stroke: {
        color: highlightStroke,
        width: 3,
      },
    },
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
    geoJsonStyle,
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
    if (layer && !layer.opacity) {
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
  // here: appends highlight layer
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
  layerStore.clearImportOptions(uuid);

  mapViewStore.removeLayer(uuid);

  if (layerStore.backgroundLayer?.uuid === uuid) {
    layerStore.setBackground(null);
  } else {
    layerStore.removeLayer(uuid);
  }
}

let abortController: AbortController | null = null;

async function handleMapClickEvent(mapClickEvent: MapClickEvent) {
  abortController?.abort();
  abortController = new AbortController();
  const { signal } = abortController;

  const layersSources: LayerSource[] = [];

  const filterOutCutLayer =
    compareSliderActive &&
    mapClickEvent.pixel[0] >
      (compareRatio ?? 0) * mapClickEvent.viewportSize[0];

  const results = await Promise.allSettled(
    sourceLayers.value
      .filter(
        (sourceLayer) =>
          // first we filter out hidden layers
          mapViewStore.getMapLayerFromUuid(sourceLayer.uuid)?.isVisible &&
          mapViewStore.getMapLayerFromUuid(sourceLayer.uuid)!.opacity > 0 &&
          // we also filter the compare slider clipped layer if the click happened
          // on the right of the slider
          !(
            filterOutCutLayer &&
            compareSliderClippedLayer?.uuid === sourceLayer.uuid
          ),
      )
      .map(async (sourceLayer) => {
        const preResolvedFeatures =
          mapClickEvent.vectorFeaturesPerLayer[sourceLayer.uuid];
        let distribution: OgcDistribution | undefined;

        if (isDatasetLayer(sourceLayer)) {
          const url = (sourceLayer.data.links ?? []).find(
            (link) => link.rel?.toLowerCase() === "distributions",
          )?.href;
          try {
            if (url) {
              const result = await fetch(url, {
                signal,
              });
              distribution = result.ok
                ? ((await result.json()) as OgcDistribution)
                : undefined;
            }
          } catch {
            distribution = undefined;
          }
        }

        const layerSource: LayerSource = {
          layerUuid: sourceLayer.uuid,
          kind: "geoadmin",
          layerId: isDatasetLayer(sourceLayer)
            ? sourceLayer.data.id
            : sourceLayer.humanId,
          distribution,
          preResolvedFeatures,
        };
        return layerSource;
      }),
  );

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      layersSources.push(result.value);
    }
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
      v-if="displayMode !== 'print' && featureStore.hasSelectedFeatures"
      @close="featureStore.$reset()"
    />
    <Toolbox v-if="displayMode !== 'print'" />
    <slot name="after" />
  </ClientOnly>
</template>
