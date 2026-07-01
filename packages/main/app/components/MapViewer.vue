<script lang="ts" setup>
import type { Layer as BaseLayer } from "@swissgeo/layers";

import { useLayerStore } from "@swissgeo/layers";
import { displayModeKey } from "~/types/injectionKeys";
import { cloneDeep } from "lodash";

const geolocationStore = useGeolocationStore();
const layerStore = useLayerStore();
const mapViewStore = useMapViewStore();

const backgroundLayer = computed(() => layerStore.backgroundLayer);

const { sources: attributionSources } = useAttributionSources(
  computed(() => layerStore.layers),
  computed(() => layerStore.backgroundLayer),
);

const sourceLayers = computed(() => layerStore.layers);

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
    if (!layer.opacity) {
      const clonedLayer = cloneDeep(layer);
      clonedLayer.opacity = 1;
      return clonedLayer;
    }
    return layer;
  });
  return layers;
});

// the layer the compare slider clips: the topmost visible overlay (the
// background/basemap is excluded by the store getter and never clipped)
const topVisibleLayer = computed(() => mapViewStore.visibleLayers.at(-1));

watch(topVisibleLayer, (layer) => {
  if (!layer && mapViewStore.isCompareSliderActive) {
    mapViewStore.setCompareSliderActive(false);
  }
});

const showAdditionalMapUi = computed(
  () => !mapViewStore.isFullscreenModeActive,
);

function changeBackground(layer: BaseLayer | null) {
  layerStore.setBackground(layer);
}

const displayMode = inject(displayModeKey, "web");
</script>

<template>
  <BaseMapViewer
    :display-mode="displayMode"
    :compare-slider-active="mapViewStore.isCompareSliderActive"
    :compare-ratio="mapViewStore.compareRatio"
    :compare-slider-clipped-layer="topVisibleLayer"
    @update:compare-ratio="mapViewStore.setCompareRatio"
  >
    <template #context-menu-popup="{ coordinate, isVisible, close }">
      <MapContextMenuPopup
        :coordinate="coordinate"
        :is-visible="isVisible"
        :close="close"
      />
    </template>
    <template #map-ui>
      <LazyMapOpenLayersGeolocationFeedback
        v-if="
          geolocationStore.active &&
          geolocationStore.position &&
          displayMode === 'web'
        "
      />
      <MapAttributionList
        v-if="displayMode === 'web'"
        :sources="attributionSources"
      />
      <LazyMapElevationWindow v-if="showAdditionalMapUi" />
    </template>
    <template #after>
      <DebugPanel
        v-if="showAdditionalMapUi && displayMode === 'web'"
        class="fixed right-[50%] bottom-0 z-3 translate-x-[50%]"
      ></DebugPanel>
      <MapBackgroundSelector
        :currentBackground="backgroundLayer"
        @setBackground="changeBackground"
      />
      <MapTimeSliderButton />
    </template>
  </BaseMapViewer>
</template>
