<script setup lang="ts">
import { displayModeKey } from "~/types/injectionKeys";
import { inject } from "vue";

import CompareSliderButton from "@/components/toolbox/toolboxButtons/CompareSliderButton.vue";
import CompassButton from "@/components/toolbox/toolboxButtons/CompassButton.vue";
import DrawButton from "@/components/toolbox/toolboxButtons/DrawButton.vue";
import FullScreenButton from "@/components/toolbox/toolboxButtons/FullScreenButton.vue";
import GeolocButton from "@/components/toolbox/toolboxButtons/GeolocButton.vue";
import ImportButton from "@/components/toolbox/toolboxButtons/ImportButton.vue";
import MeasureButton from "@/components/toolbox/toolboxButtons/MeasureButton.vue";
import PrintButton from "@/components/toolbox/toolboxButtons/PrintButton.vue";
import RecenterButton from "@/components/toolbox/toolboxButtons/RecenterButton.vue";
import ShareButton from "@/components/toolbox/toolboxButtons/ShareButton.vue";
import TimeSliderButton from "@/components/toolbox/toolboxButtons/TimeSliderButton.vue";
import Toggle3dButton from "@/components/toolbox/toolboxButtons/Toggle3dButton.vue";
import ZoomButtons from "@/components/toolbox/toolboxButtons/ZoomButtons.vue";
import ToolboxDetail from "@/components/toolbox/ToolboxDetail.vue";
import ReportIssueButton from "@/components/toolbox/toolboxButtons/ReportIssueButton.vue";
import { useToolboxStore } from "@/stores/toolbox";

const toolboxStore = useToolboxStore();

const displayMode = inject(displayModeKey, "web");

const isWebMode = computed(() => displayMode === "web");
const isEmbedMode = computed(() => displayMode === "embed");
</script>

<template>
  <div class="absolute top-4 right-4" data-testid="toolbox-right">
    <UCard
      v-if="isWebMode"
      class="mb-4"
      :ui="{
        body: 'flex flex-col items-center gap-2 p-1 sm:p-2',
      }"
    >
      <FullScreenButton v-if="isWebMode && toolboxStore.showFullScreenButton" />
      <GeolocButton v-if="isWebMode && toolboxStore.showGeolocationButton" />
      <Toggle3dButton v-if="isWebMode && toolboxStore.show3dButton" />
      <CompassButton v-if="isWebMode && toolboxStore.showCompassButton" />
      <RecenterButton v-if="isWebMode && toolboxStore.showRecenterButton" />
      <slot />
    </UCard>
    <UCard
      class="mb-4"
      :ui="{
        body: 'flex flex-col items-center gap-2 p-1 sm:p-2',
      }"
    >
      <ZoomButtons
        v-if="(isWebMode || isEmbedMode) && toolboxStore.showZoomButtons"
      />
    </UCard>
    <UCard
      v-if="isWebMode"
      class="mb-4"
      :ui="{
        body: 'flex flex-col items-center gap-2 p-1 sm:p-2',
      }"
    >
      <DrawButton v-if="isWebMode && toolboxStore.showDrawButton" />
      <MeasureButton v-if="isWebMode && toolboxStore.showMeasureButton" />
      <CompareSliderButton
        v-if="isWebMode && toolboxStore.showCompareSliderButton"
      />
      <TimeSliderButton v-if="isWebMode && toolboxStore.showTimeSliderButton" />
      <ImportButton v-if="isWebMode && toolboxStore.showImportButton" />
      <ShareButton v-if="isWebMode && toolboxStore.showShareButton" />
      <PrintButton v-if="isWebMode && toolboxStore.showPrintButton" />
    </UCard>
    <UCard
      v-if="isWebMode"
      :ui="{
        body: 'flex flex-col items-center gap-2 p-1 sm:p-2',
      }"
    >
      <ReportIssueButton
        v-if="isWebMode && toolboxStore.showReportIssueButton"
      />
    </UCard>

    <ToolboxDetail />
  </div>
</template>

<style scoped></style>
