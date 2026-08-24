<script lang="ts" setup>
import type { Layer as MapLayer } from "@swissgeo/map";

import {
  useSidebarStore,
  SidebarType,
  SIDEBAR_CONTENT_WIDTH,
} from "@swissgeo/skeleton";
import { useI18n } from "vue-i18n";

import LayerCart from "@/components/sidebar/LayerCart.vue";

const uiStore = useSidebarStore();
const { t } = useI18n();

const { mapLayers } = defineProps<{
  mapLayers: Ref<MapLayer[]>;
}>();
defineSlots<{
  "bottom-controls"?: () => unknown;
}>();

function toggleSidebar() {
  if (uiStore.isSidebarOpen) {
    uiStore.closeSidebar();
  } else {
    uiStore.setSidebar(SidebarType.LAYER_CART);
  }
}
</script>

<template>
  <div
    class="absolute top-0 left-0 flex h-[calc(100vh-var(--ui-header-height))]"
  >
    <div
      v-show="uiStore.isSidebarOpen"
      :style="{ width: SIDEBAR_CONTENT_WIDTH + 'px' }"
      class="flex h-full flex-col bg-white shadow-lg"
    >
      <LayerCart
        v-if="uiStore.currentSidebar === SidebarType.LAYER_CART"
        :mapLayers="mapLayers"
      ></LayerCart>
      <div class="flex flex-col items-center gap-2">
        <slot name="bottom-controls" />
      </div>
    </div>

    <!-- Collapses the sidebar down to this tab, and brings it back -->
    <button
      data-testid="button-layer-cart-panel"
      class="my-auto flex h-16 w-6 items-center justify-center rounded-r border border-l-0 border-gray-200 bg-white text-gray-500 shadow-md hover:text-gray-900"
      :title="uiStore.isSidebarOpen ? t('menu.collapse') : t('menu.expand')"
      @click="toggleSidebar"
    >
      <UIcon
        :name="
          uiStore.isSidebarOpen
            ? 'i-lucide-chevron-left'
            : 'i-lucide-chevron-right'
        "
        class="size-4"
      />
    </button>
  </div>
</template>
