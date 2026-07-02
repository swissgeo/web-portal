<script setup lang="ts">
import { useMap } from "@swissgeo/map";
import { IconButton } from "@swissgeo/skeleton";
import PrintJobListing from "~/components/debug/PrintJobListing.vue";
import { printFormats, printOrientations } from "~/types/print";

import { usePrintFraming } from "../../composables/usePrintFraming";

const emit = defineEmits<{
  close: [];
}>();

const { zoomLevel } = useMap();
const {
  isZoomStepEnabled,
  selectedPrintFormat,
  selectedPrintResolution,
  selectedPrintOrientation,
  isCenterLocked,
  isZoomLocked,
  zoomLevelForPrint,
  isPrintExtentOutOfBounds,
  isPrintExtentBeyondViewport,
  adjustToLockedView,
  scaleOfPrintFormatted,
  updatePrintState,
} = usePrintFraming();

const printFormatItems = ref(
  printFormats.map((format) => ({
    label: format.toUpperCase(),
    value: format,
  })),
);

const printResolutionItems = ref([
  { label: "96 dpi", value: 96 },
  { label: "192 dpi", value: 192 },
  { label: "288 dpi", value: 288 },
]);

const printOrientationItems = ref(
  printOrientations.map((orientation) => ({
    label: orientation.toUpperCase(),
    value: orientation,
  })),
);

function handleClose() {
  emit("close");
}

function handleSendPrintRequest() {
  updatePrintState();
}
</script>

<template>
  <div class="z-10 h-fit min-h-[100px] w-fit min-w-[100px] bg-white p-[10px]">
    <div>
      <IconButton @click="handleClose" iconName="X" severity="secondary">
      </IconButton>
    </div>
    <div class="flex flex-col gap-4">
      <h3 class="mb-4 text-lg font-bold">Print Framing</h3>
      <div>Zoom Level: {{ zoomLevel }}</div>
      <div>Zoom Level for print: {{ zoomLevelForPrint }}</div>
      <div>Out of Swiss bounds: {{ isPrintExtentOutOfBounds }}</div>
      <div>Beyond viewport: {{ isPrintExtentBeyondViewport }}</div>
      <div>Scale of print: {{ scaleOfPrintFormatted }}</div>
      <UFormField
        orientation="horizontal"
        label="Enable strict zoom steps"
        class="w-72"
      >
        <USwitch id="enable-zoom-step-checkbox" v-model="isZoomStepEnabled" />
      </UFormField>

      <UFormField
        orientation="horizontal"
        label="Lock center to view"
        class="w-72"
      >
        <USwitch id="lock-center-checkbox" v-model="isCenterLocked" />
      </UFormField>

      <UFormField
        orientation="horizontal"
        label="Lock zoom to view"
        class="w-72"
      >
        <USwitch id="lock-zoom-checkbox" v-model="isZoomLocked" />
      </UFormField>

      <UFormField orientation="horizontal" label="Print size" class="w-72">
        <USelect v-model="selectedPrintFormat" :items="printFormatItems" />
      </UFormField>

      <UFormField
        orientation="horizontal"
        label="Print resolution"
        class="w-72"
      >
        <USelect
          v-model="selectedPrintResolution"
          :items="printResolutionItems"
        />
      </UFormField>

      <UFormField
        orientation="horizontal"
        label="Print orientation"
        class="w-72"
      >
        <USelect
          v-model="selectedPrintOrientation"
          :items="printOrientationItems"
        />
      </UFormField>
      <UButton v-if="isCenterLocked || isZoomLocked" @click="adjustToLockedView"
        >Zoom to locked zoom level</UButton
      >
      <UButton v-if="!isPrintExtentOutOfBounds" @click="handleSendPrintRequest"
        >Send Print Request</UButton
      >
      <PrintJobListing />
    </div>
  </div>
</template>
