<script lang="ts" setup>
import type { Layer as MapLayer } from "@swissgeo/map";

import { useSidebarStore, SidebarType } from "@swissgeo/skeleton";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import BackgroundSelector from "@/components/sidebar/backgroundSelector/BackgroundSelector.vue";
import LayerCart from "@/components/sidebar/LayerCart.vue";

import LayerCatalog from "./layerCatalog/LayerCatalog.vue";
import ResponsivePanel from "./ResponsivePanel.vue";

const uiStore = useSidebarStore();
const { t } = useI18n();

const { mapLayers, isVisible = true } = defineProps<{
  mapLayers: Ref<MapLayer[]>;
  isVisible?: boolean;
}>();
defineSlots<{
  "bottom-controls"?: () => unknown;
}>();

const isDesktop = useIsDesktop();
// The catalog only renders inside the sidebar on desktop. On mobile it is a
// bottom sheet, so we hide the sidebar content in that case.
const isSidebarContentVisible = computed(
  () =>
    uiStore.isSidebarOpen &&
    (uiStore.currentSidebar !== SidebarType.GEOCATALOG_TREE || isDesktop.value),
);

function closeLayerCatalog() {
  // On mobile the design opens the catalog only through the footer, so closing returns to the map
  if (isDesktop.value) {
    uiStore.setSidebar(SidebarType.LAYER_CART);
  } else {
    uiStore.closeSidebar();
  }
}

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
    v-show="isVisible"
    class="absolute top-0 left-0 flex h-[calc(100dvh-var(--ui-header-height))]"
  >
    <!-- The catalog drawer teleports out of this element, so it gets isVisible too -->
    <div
      v-show="isSidebarContentVisible"
      :style="{ width: uiStore.sidebarContentWidth + 'px' }"
      class="flex h-full flex-col bg-default text-default shadow-lg"
    >
      <LayerCart
        v-if="uiStore.currentSidebar === SidebarType.LAYER_CART"
        :mapLayers="mapLayers"
      />
      <ResponsivePanel
        v-else-if="uiStore.currentSidebar === SidebarType.GEOCATALOG_TREE"
        :title="t('layerCatalog.title')"
        :closeLabel="t('layerCatalog.close')"
        :expandLabel="t('layerCatalog.expand')"
        :collapseLabel="t('layerCatalog.collapse')"
        :isVisible="isVisible"
        @close="closeLayerCatalog"
      >
        <LayerCatalog />
      </ResponsivePanel>
      <div class="px-2">
        <USeparator />
        <div class="my-4">
          <BackgroundSelector />
        </div>
      </div>
    </div>

    <!-- Collapses the sidebar down to this tab, and brings it back -->
    <UButton
      data-testid="button-layer-cart-panel"
      color="neutral"
      variant="ghost"
      :icon="
        uiStore.isSidebarOpen
          ? 'i-lucide-chevron-left'
          : 'i-lucide-chevron-right'
      "
      class="my-auto h-16 w-6 justify-center rounded-l-none rounded-r border border-l-0 border-default bg-default px-0 py-0 text-muted shadow-md hover:bg-elevated hover:text-highlighted"
      :title="uiStore.isSidebarOpen ? t('menu.collapse') : t('menu.expand')"
      :aria-label="
        uiStore.isSidebarOpen ? t('menu.collapse') : t('menu.expand')
      "
      @click="toggleSidebar"
    />
  </div>
</template>
