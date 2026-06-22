<script lang="ts" setup>
import type { Layer as BaseLayer } from "@swissgeo/layers";

import { useLayerStore } from "@swissgeo/layers";

const geolocationStore = useGeolocationStore();
const layerStore = useLayerStore();
const mapViewStore = useMapViewStore();

const displayMode = inject<"web" | "print" | "embed">("displayMode", "web");

const backgroundLayer = computed(() => layerStore.backgroundLayer);

const { sources: attributionSources } = useAttributionSources(
  computed(() => layerStore.layers),
  computed(() => layerStore.backgroundLayer),
);

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
      <DrawingFeatureInfoWindow v-if="showAdditionalMapUi" />
      <MapBackgroundSelector
        :currentBackground="backgroundLayer"
        @setBackground="changeBackground"
      />
      <MapTimeSliderButton />
    </template>
  </BaseMapViewer>
</template>
