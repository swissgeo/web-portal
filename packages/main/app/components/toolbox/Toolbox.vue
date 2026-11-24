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
const { isEnabled } = useFeatureFlags();
const { cmsUrl } = useCmsUrl();

const displayMode = inject(displayModeKey, "web");

const isWebMode = computed(() => displayMode === "web");
const isEmbedMode = computed(() => displayMode === "embed");
// On a phone the map keeps fullscreen, geolocation and zoom. The other tools
// open in a drawer from the footer. A narrow desktop window keeps the desktop
// toolbox while the mobile UI is off.
const isMobileLayout = computed(
  () => isWebMode.value && isEnabled("enableMobileUi") && !isDesktop.value,
);

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

// The tools drawer says once that some of its tools follow later. Import and
// print are left out on a phone.
const hasUnavailableTools = computed(() =>
  (
    [
      [toolboxStore.showDrawButton, "tools.enableDrawing"],
      [toolboxStore.showMeasureButton, "tools.enableMeasure"],
      [toolboxStore.showCompareSliderButton, "tools.enableCompare"],
      [toolboxStore.showShareButton, "tools.enableShare"],
    ] as const
  ).some(([isShown, flag]) => isShown && !isEnabled(flag)),
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
    <ImportButton v-if="toolboxStore.showImportButton && !isMobileLayout" />
    <ShareButton v-if="toolboxStore.showShareButton" />
    <PrintButton v-if="toolboxStore.showPrintButton && !isMobileLayout" />
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
      fitsContent
      @close="sidebarStore.closeSidebar()"
    >
      <div class="mx-4 flex flex-col gap-4 border-t border-default py-4">
        <div
          v-if="hasUnavailableTools"
          class="rounded-lg bg-info p-4 text-sm leading-small-text font-medium text-info-on-accent"
          data-testid="toolbox-mobile-unavailable"
        >
          <p>{{ t("toolbox.featureFlag.someNotAvailable") }}</p>
          <a
            :href="cmsUrl(t('toolbox.featureFlag.links.roadmap'))"
            target="_blank"
            rel="noopener"
            class="font-semibold underline"
          >
            {{ t("toolbox.featureFlag.someWorkingOnIt") }}
          </a>
        </div>
        <!-- Three tools per row, with a line below each row -->
        <div
          class="grid auto-rows-14 grid-cols-3 place-items-center bg-[repeating-linear-gradient(transparent_0_calc(3.5rem-1px),var(--ui-border)_calc(3.5rem-1px)_3.5rem)]"
          data-testid="toolbox-mobile-tools"
        >
          <Tools />
        </div>
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
