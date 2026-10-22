<script lang="ts" setup>
import type { Layer as MapLayer } from "@swissgeo/map";

import { useSidebarStore, SidebarType } from "@swissgeo/skeleton";
import { panelSnapPointKey } from "~/types/injectionKeys";
import { computed, inject, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import BackgroundSelector from "@/components/sidebar/backgroundSelector/BackgroundSelector.vue";
import LayerCart from "@/components/sidebar/LayerCart.vue";

import LayerCatalog from "./layerCatalog/LayerCatalog.vue";
import ResponsivePanel from "./ResponsivePanel.vue";

const uiStore = useSidebarStore();

// The map panel opens partially, so the map stays visible while layers change
const panelSnapPoint = inject(panelSnapPointKey, ref(null));
watch(
  () => uiStore.currentSidebar,
  (sidebar) => {
    if (sidebar === SidebarType.LAYER_CART) {
      panelSnapPoint.value = null;
    }
  },
);
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
const isSidebarContentVisible = computed(() => isDesktop.value);

function closeLayerCatalog() {
  // On mobile the design opens the catalog only through the footer, so closing returns to the map
  if (isDesktop.value) {
    uiStore.setSidebar(SidebarType.LAYER_CART);
  } else {
    uiStore.closeSidebar();
  }
}

watch(
  () => isDesktop.value,
  (desktop) => {
    if (desktop) {
      // On desktop the sidebar always shows a panel
      if (!uiStore.currentSidebar) {
        uiStore.setSidebar(SidebarType.LAYER_CART);
      }
    } else {
      // On mobile the design opens the panels only through the footer
      uiStore.closeSidebar();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div v-show="isVisible" class="absolute top-0 left-0 flex h-full">
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
        :itemCount="mapLayers.value.length"
        :isVisible="isVisible"
        @close="uiStore.closeSidebar()"
      >
        <LayerCart :mapLayers="mapLayers" />
        <!-- The side column is hidden on mobile, so the drawer shows its own background selector -->
        <template v-if="!isDesktop" #footer>
          <div class="border-t border-default px-2 py-4">
            <BackgroundSelector />
          </div>
        </template>
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
      <!-- Stays mounted on mobile and next to the catalog, because it picks the
           default background. It shows only with the map panel. -->
      <div
        v-show="uiStore.currentSidebar === SidebarType.LAYER_CART"
        data-testid="sidebar-background-selector"
        class="px-2"
      >
        <USeparator />
        <div class="my-4">
          <BackgroundSelector />
        </div>
      </div>
    </div>
  </div>
</template>
