<script lang="ts" setup>
import type { Layer as MapLayer } from "@swissgeo/map";
import type { SearchResult } from "@swissgeo/search";

import {
  LogoPic,
  useSidebarStore,
  SidebarType,
  SIDEBAR_CONTENT_WIDTH,
} from "@swissgeo/skeleton";

import LayerCart from "@/components/sidebar/LayerCart.vue";
import SearchPanel from "@/components/sidebar/search/SearchPanel.vue";
import SidebarIcons from "@/components/sidebar/SidebarIcons.vue";

const uiStore = useSidebarStore();

const emit = defineEmits<{
  "search-result-selected": [result: SearchResult];
  "reset-app": [void];
}>();
const { mapLayers } = defineProps<{
  mapLayers: Ref<MapLayer[]>;
}>();
defineSlots<{
  "bottom-controls"?: () => unknown;
}>();

function resetApp() {
  emit("reset-app");
}

function handleSearchResultSelected(result: SearchResult) {
  emit("search-result-selected", result);
}

// used for the dragging thing
const sidebarSecondColumnWidth = SIDEBAR_CONTENT_WIDTH;
</script>

<template>
  <div class="absolute top-0 left-0 flex h-screen w-auto min-w-12 shadow-lg">
    <div class="flex flex-col">
      <div class="flex shrink-0 justify-center bg-white">
        <LogoPic
          class="h-12"
          @logo-click="resetApp"
          :condensed="!uiStore.isSidebarOpen"
        />
      </div>
      <div
        class="flex min-h-0 w-full flex-1 flex-row border-t border-neutral-100 p-0"
      >
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
          <!-- TODO and TO DISCUSS:
                    layertCart should have the mapData layers (except bg layer) as a prop
                    searchPanel should have sources
                -->
          <LayerCart
            v-if="uiStore.currentSidebar === SidebarType.LAYER_CART"
            :mapLayers="mapLayers"
          ></LayerCart>
          <SearchPanel
            v-if="uiStore.currentSidebar === SidebarType.SEARCH"
            @result-selected="handleSearchResultSelected"
          ></SearchPanel>
        </div>
      </div>
    </div>
  </div>
</template>
