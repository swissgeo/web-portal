<script setup lang="ts">
import { SidebarType, useSidebarStore } from "@swissgeo/skeleton";
import { createReusableTemplate } from "@vueuse/core";
import { displayModeKey } from "~/types/injectionKeys";
import { inject } from "vue";

import ResponsivePanel from "@/components/sidebar/ResponsivePanel.vue";
import CompareSliderButton from "@/components/toolbox/toolboxButtons/CompareSliderButton.vue";
import CompassButton from "@/components/toolbox/toolboxButtons/CompassButton.vue";
import DrawButton from "@/components/toolbox/toolboxButtons/DrawButton.vue";
import FullScreenButton from "@/components/toolbox/toolboxButtons/FullScreenButton.vue";
import GeolocButton from "@/components/toolbox/toolboxButtons/GeolocButton.vue";
import ImportButton from "@/components/toolbox/toolboxButtons/ImportButton.vue";
import MeasureButton from "@/components/toolbox/toolboxButtons/MeasureButton.vue";
import PrintButton from "@/components/toolbox/toolboxButtons/PrintButton.vue";
import ShareButton from "@/components/toolbox/toolboxButtons/ShareButton.vue";
import Toggle3dButton from "@/components/toolbox/toolboxButtons/Toggle3dButton.vue";
import ZoomButtons from "@/components/toolbox/toolboxButtons/ZoomButtons.vue";
import ToolboxDetail from "@/components/toolbox/ToolboxDetail.vue";
import { useToolboxStore } from "@/stores/toolbox";

const toolboxStore = useToolboxStore();
const sidebarStore = useSidebarStore();
const { t } = useI18n();
const isDesktop = useIsDesktop();

const displayMode = inject(displayModeKey, "web");

const isWebMode = computed(() => displayMode === "web");
const isEmbedMode = computed(() => displayMode === "embed");
// On a phone the map keeps fullscreen, geolocation and zoom. The other tools
// open in a drawer from the footer.
const isMobileLayout = computed(() => isWebMode.value && !isDesktop.value);

// A tool panel opens its own drawer, so the tools drawer makes room for it.
watch(
  () => toolboxStore.activeDetailPanel,
  (panel) => {
    if (
      panel &&
      isMobileLayout.value &&
      sidebarStore.currentSidebar === SidebarType.TOOLS
    ) {
      sidebarStore.closeSidebar();
    }
  },
);

const [DefineMapControls, MapControls] = createReusableTemplate();
const [DefineTools, Tools] = createReusableTemplate();
</script>

<template>
  <DefineMapControls>
    <FullScreenButton
      v-if="toolboxStore.showFullScreenButton"
      :icon-only="isMobileLayout"
    />
    <GeolocButton
      v-if="toolboxStore.showGeolocationButton"
      :icon-only="isMobileLayout"
    />
    <Toggle3dButton v-if="toolboxStore.show3dButton" />
    <CompassButton v-if="toolboxStore.showCompassButton" />
    <slot />
  </DefineMapControls>
  <DefineTools>
    <DrawButton v-if="toolboxStore.showDrawButton" />
    <MeasureButton v-if="toolboxStore.showMeasureButton" />
    <CompareSliderButton v-if="toolboxStore.showCompareSliderButton" />
    <ImportButton v-if="toolboxStore.showImportButton" />
    <ShareButton v-if="toolboxStore.showShareButton" />
    <PrintButton v-if="toolboxStore.showPrintButton" />
  </DefineTools>

  <template v-if="isMobileLayout">
    <!-- Below the drawers (z-20), so an open drawer covers it -->
    <UCard
      class="absolute top-4 right-4 z-10"
      :ui="{ body: 'flex flex-col items-center gap-1 p-1 sm:p-1' }"
      data-testid="toolbox-right"
    >
      <MapControls />
    </UCard>
    <!-- Above the footer (4rem) and the attribution -->
    <UCard
      v-if="toolboxStore.showZoomButtons"
      class="absolute right-4 bottom-24 z-10"
      :ui="{ body: 'flex flex-col items-center gap-1 p-1 sm:p-1' }"
      data-testid="toolbox-zoom"
    >
      <ZoomButtons />
    </UCard>
    <ResponsivePanel
      v-if="sidebarStore.currentSidebar === SidebarType.TOOLS"
      :title="t('footer.mobileNav.tools')"
      :closeLabel="t('toolbox.mobileDrawer.close')"
      :expandLabel="t('toolbox.mobileDrawer.expand')"
      :collapseLabel="t('toolbox.mobileDrawer.collapse')"
      @close="sidebarStore.closeSidebar()"
    >
      <div
        class="flex flex-wrap justify-center gap-2 p-4"
        data-testid="toolbox-mobile-tools"
      >
        <Tools />
      </div>
    </ResponsivePanel>
    <ToolboxDetail />
  </template>
  <div
    v-else
    class="absolute top-4 right-4 bottom-4 flex flex-col"
    data-testid="toolbox-right"
  >
    <UCard
      v-if="isWebMode"
      class="mb-4"
      :ui="{
        body: 'flex flex-col items-center gap-2 p-1 sm:p-2',
      }"
    >
      <MapControls />
    </UCard>
    <UCard
      v-if="isWebMode"
      class="mb-4"
      :ui="{
        body: 'flex flex-col items-center gap-2 p-1 sm:p-2',
      }"
    >
      <Tools />
    </UCard>
    <UCard
      v-if="(isWebMode || isEmbedMode) && toolboxStore.showZoomButtons"
      class="mt-auto mb-20 self-end md:mb-14"
      :ui="{ body: 'flex flex-col items-center gap-1 p-1 sm:p-1' }"
    >
      <ZoomButtons />
    </UCard>

    <ToolboxDetail />
  </div>
</template>
