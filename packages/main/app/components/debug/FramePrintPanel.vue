<script setup lang="ts">
import { useMap } from "@swissgeo/map";
import { IconButton } from "@swissgeo/skeleton";
import PrintJobListing from "~/components/debug/PrintJobListing.vue";
import { usePrintFraming } from "~/composables/usePrintFraming";
import { printFormats, printOrientations } from "~/types/print";

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
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
    label:
      orientation === "portrait"
        ? t("print.orientationPortrait")
        : t("print.orientationLandscape"),
    value: orientation,
  })),
);

function handleClose() {
  emit("close");
}
</script>

<template>
  <div class="z-10 h-fit min-h-[100px] w-fit min-w-[100px] bg-white p-[10px]">
    <div>
      <IconButton
        @click="handleClose"
        iconName="X"
        severity="neutral"
        variant="ghost"
      >
      </IconButton>
    </div>
    <div class="flex flex-col gap-4">
      <h3 class="mb-4 text-lg font-bold">Print Framing</h3>
      <div>{{ t("print.zoomLevel") }}: {{ zoomLevel }}</div>
      <div>{{ t("print.zoomLevelForPrint") }}: {{ zoomLevelForPrint }}</div>
      <div>
        {{ t("print.warningOutsideSwitzerland") }}:
        {{ isPrintExtentOutOfBounds }}
      </div>
      <div>
        {{ t("print.warningOutsideViewportLabel") }}:
        {{ isPrintExtentBeyondViewport }}
      </div>
      <div>{{ t("print.printScale") }}: {{ scaleOfPrintFormatted }}</div>
      <UFormField
        orientation="horizontal"
        :label="t('print.enableStrictZoomStepsLabel')"
        class="w-72"
      >
        <USwitch id="enable-zoom-step-checkbox" v-model="isZoomStepEnabled" />
      </UFormField>

      <UFormField
        orientation="horizontal"
        :label="t('print.lockCenterToViewLabel')"
        class="w-72"
      >
        <USwitch id="lock-center-checkbox" v-model="isCenterLocked" />
      </UFormField>

      <UFormField
        orientation="horizontal"
        :label="t('print.lockZoomToViewLabel')"
        class="w-72"
      >
        <USwitch id="lock-zoom-checkbox" v-model="isZoomLocked" />
      </UFormField>

      <UFormField
        orientation="horizontal"
        :label="t('print.printSizeLabel')"
        class="w-72"
      >
        <USelect v-model="selectedPrintFormat" :items="printFormatItems" />
      </UFormField>

      <UFormField
        orientation="horizontal"
        :label="t('print.printResolutionLabel')"
        class="w-72"
      >
        <USelect
          v-model="selectedPrintResolution"
          :items="printResolutionItems"
        />
      </UFormField>

      <UFormField
        orientation="horizontal"
        :label="t('print.printOrientationLabel')"
        class="w-72"
      >
        <USelect
          v-model="selectedPrintOrientation"
          :items="printOrientationItems"
        />
      </UFormField>
      <UButton
        v-if="isCenterLocked || isZoomLocked"
        @click="adjustToLockedView"
        >{{ t("print.zoomToLockedZoomLevel") }}</UButton
      >
      <UButton v-if="!isPrintExtentOutOfBounds" @click="updatePrintState">{{
        t("print.sendPrintRequest")
      }}</UButton>
      <PrintJobListing />
    </div>
  </div>
</template>
