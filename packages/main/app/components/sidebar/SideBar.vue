<script lang="ts" setup>
import type { Layer as MapLayer } from "@swissgeo/map";

import {
  useSidebarStore,
  SidebarType,
  SIDEBAR_CONTENT_WIDTH,
} from "@swissgeo/skeleton";

import LayerCart from "@/components/sidebar/LayerCart.vue";
import SidebarIcons from "@/components/sidebar/SidebarIcons.vue";

const uiStore = useSidebarStore();

const { mapLayers } = defineProps<{
  mapLayers: Ref<MapLayer[]>;
}>();
defineSlots<{
  "bottom-controls"?: () => unknown;
}>();

const sidebarSecondColumnWidth = SIDEBAR_CONTENT_WIDTH;
</script>

<template>
  <div
    class="absolute top-0 left-0 flex h-[calc(100vh-var(--ui-header-height))] w-auto min-w-12 shadow-lg"
  >
    <div class="flex flex-col">
      <div class="flex min-h-0 w-full flex-1 flex-row border-neutral-100 p-0">
        <!-- First column -->
        <div
          class="flex h-full min-w-16 flex-col items-center justify-between pt-4"
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
          class="relative flex h-full bg-white transition-[width] duration-75 ease-out"
        >
          <LayerCart
            v-if="uiStore.currentSidebar === SidebarType.LAYER_CART"
            :mapLayers="mapLayers"
          ></LayerCart>
        </div>
      </div>
    </div>
  </div>
</template>
