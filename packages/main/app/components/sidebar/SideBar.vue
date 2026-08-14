<script lang="ts" setup>
import type { Layer as MapLayer } from "@swissgeo/map";

import { useLayerStore } from "@swissgeo/layers";
import {
  useSidebarStore,
  SidebarType,
  SIDEBAR_CONTENT_WIDTH,
  SIDEBAR_HANDLE_WIDTH,
  SIDEBAR_PANEL_WIDTH,
} from "@swissgeo/skeleton";
import { computed, toRef } from "vue";

import LayerCart from "@/components/sidebar/LayerCart.vue";
import SidebarIcons from "@/components/sidebar/SidebarIcons.vue";
import { useBackgroundLayers } from "@/composables/useBackgroundLayers";

const uiStore = useSidebarStore();
const layerStore = useLayerStore();

const { mapLayers, showMapControls = false } = defineProps<{
  mapLayers: Ref<MapLayer[]>;
  showMapControls?: boolean;
}>();
defineSlots<{
  "bottom-controls"?: () => unknown;
}>();

const sidebarSecondColumnWidth = SIDEBAR_CONTENT_WIDTH;
const sidebarPanelWidth = SIDEBAR_PANEL_WIDTH;
const sidebarHandleWidth = SIDEBAR_HANDLE_WIDTH;
const currentBackground = computed(() => layerStore.backgroundLayer);

function selectBackground(
  backgroundLayer: Parameters<typeof layerStore.setBackground>[0],
) {
  layerStore.setBackground(backgroundLayer);
}

const { backgroundLayers } = useBackgroundLayers(
  currentBackground,
  toRef(() => showMapControls),
  selectBackground,
);
</script>

<template>
  <div
    class="absolute top-0 left-0 flex h-[calc(100vh-var(--ui-header-height))] w-auto min-w-16"
  >
    <div class="flex flex-col">
      <div class="flex min-h-0 w-full flex-1 flex-row border-neutral-100 p-0">
        <!-- First column -->
        <div
          class="flex h-full w-16 flex-col items-center justify-between border-r border-default bg-default pt-4"
        >
          <div class="flex flex-col items-center gap-2">
            <SidebarIcons></SidebarIcons>
          </div>
          <div class="flex flex-col items-center gap-2">
            <slot name="bottom-controls" />
          </div>
        </div>
        <!-- Second column -->
        <div
          v-show="uiStore.isSidebarOpen"
          :style="{ width: sidebarSecondColumnWidth + 'px' }"
          class="relative flex h-full min-w-0 bg-default shadow-lg transition-[width] duration-75 ease-out"
          data-testid="sidebar-panel"
        >
          <div
            :style="{ width: sidebarPanelWidth + 'px' }"
            class="h-full min-w-0 shrink-0"
            data-testid="sidebar-panel-content"
          >
            <LayerCart
              v-if="uiStore.currentSidebar === SidebarType.LAYER_CART"
              :mapLayers="mapLayers"
              :background-layers="backgroundLayers"
              :current-background="currentBackground"
              @set-background="selectBackground"
            ></LayerCart>
          </div>
          <div
            :style="{ width: sidebarHandleWidth + 'px' }"
            class="flex h-full shrink-0 items-center justify-center bg-default"
            data-testid="sidebar-panel-handle"
            aria-hidden="true"
          >
            <span class="h-12 w-1.5 rounded-full bg-accented"></span>
          </div>
        </div>
      </div>
    </div>
    <MapBackgroundSelectorRounded
      v-if="showMapControls"
      :background-layers="backgroundLayers"
      :current-background-layer="currentBackground"
      class="sm:hidden"
      @select-background="selectBackground"
    />
  </div>
</template>
