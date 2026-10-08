<script lang="ts" setup>
import type { Layer as MapLayer } from "@swissgeo/map";

import { useSidebarStore, SidebarType } from "@swissgeo/skeleton";
import { panelSnapPointKey } from "~/types/injectionKeys";
import { computed, inject, ref } from "vue";
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
// On mobile the cart and the catalog are bottom drawers, side column
// only shows on desktop.
const isSidebarContentVisible = computed(
  () => uiStore.isSidebarOpen && isDesktop.value,
);

function closeLayerCatalog() {
  // On mobile the design opens the catalog only through the footer, so closing returns to the map
  if (isDesktop.value) {
    uiStore.setSidebar(SidebarType.LAYER_CART);
  } else {
    uiStore.closeSidebar();
  }
}

const panelSnapPoint = inject(panelSnapPointKey, ref(null));

// The open background list is taller than the half-open drawer, so the drawer
// opens fully to keep every background reachable.
function openPanelFully(isBackgroundListOpen: boolean) {
  if (isBackgroundListOpen) {
    panelSnapPoint.value = 1;
  }
}

const sidebarToggleLabel = computed(() =>
  uiStore.isSidebarOpen ? t("menu.collapse") : t("menu.expand"),
);

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
    <!-- drawers teleport out of this element isVisible must be applied too -->
    <div
      v-show="isSidebarContentVisible"
      :style="{ width: uiStore.sidebarContentWidth + 'px' }"
      class="flex h-full flex-col bg-default text-default shadow-lg"
    >
      <ResponsivePanel
        v-if="uiStore.currentSidebar === SidebarType.LAYER_CART"
        :title="t('menu.map')"
        :closeLabel="t('layerCart.close')"
        :expandLabel="t('layerCart.expand')"
        :collapseLabel="t('layerCart.collapse')"
        :hasHeader="false"
        :isVisible="isVisible"
        @close="uiStore.closeSidebar()"
      >
        <LayerCart :mapLayers="mapLayers" />
        <!-- Mobile drawers replace the side column, so the background selector moves into this one -->
        <div v-if="!isDesktop" class="px-2">
          <USeparator />
          <div class="my-4">
            <BackgroundSelector @update:open="openPanelFully" />
          </div>
        </div>
      </ResponsivePanel>
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
      <div v-if="isDesktop" class="px-2">
        <USeparator />
        <div class="my-4">
          <BackgroundSelector />
        </div>
      </div>
    </div>

    <!-- Collapses the sidebar down to this tab, and brings it back.
         On mobile the footer opens and closes the panels instead. -->
    <UButton
      data-testid="button-layer-cart-panel"
      color="neutral"
      variant="ghost"
      :icon="
        uiStore.isSidebarOpen
          ? 'i-lucide-chevron-left'
          : 'i-lucide-chevron-right'
      "
      class="my-auto h-16 w-6 justify-center rounded-l-none rounded-r border border-l-0 border-default bg-default px-0 py-0 text-muted shadow-md hover:bg-elevated hover:text-highlighted max-md:hidden"
      :title="sidebarToggleLabel"
      :aria-label="sidebarToggleLabel"
      @click="toggleSidebar"
    />
  </div>
</template>
