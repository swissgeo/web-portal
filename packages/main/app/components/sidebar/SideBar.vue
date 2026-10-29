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

// On desktop the sidebar always shows a panel. Not while a dataset hides it,
// so the dataset page can still tell a direct link from a panel
watch(
  () => isDesktop.value && isVisible,
  (shown) => {
    if (shown && !uiStore.currentSidebar) {
      uiStore.setSidebar(SidebarType.LAYER_CART);
    }
  },
  { immediate: true },
);

watch(
  () => isDesktop.value,
  (desktop) => {
    // On mobile the design opens the panels only through the footer
    if (!desktop) {
      uiStore.closeSidebar();
    }
  },
);
</script>

<template>
  <div v-show="isVisible" class="absolute top-0 left-0 flex h-full">
    <!--
      The map and the footer leave its width free (see default.vue).
      On mobile the content moves into bottom drawers and the column is left empty.
      drawers teleport out of this element isVisible must be applied too
    -->
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
    <!--
      The catalog floats above the column and the map instead of widening the
      sidebar, so the map keeps its size. On mobile the panel teleports to a
      bottom drawer, so the wrapper itself stays hidden.
    -->
    <div
      v-if="uiStore.currentSidebar === SidebarType.GEOCATALOG_TREE"
      data-testid="layer-catalog-overlay"
      class="absolute inset-y-0 left-0 z-60 hidden w-screen max-w-layer-catalog flex-col bg-default text-default shadow-lg md:flex"
    >
      <ResponsivePanel
        :title="t('layerCatalog.title')"
        :closeLabel="t('layerCatalog.close')"
        :expandLabel="t('layerCatalog.expand')"
        :collapseLabel="t('layerCatalog.collapse')"
        :isVisible="isVisible"
        @close="closeLayerCatalog"
      >
        <LayerCatalog />
      </ResponsivePanel>
    </div>
  </div>
</template>
