<script setup lang="ts">
import { useMap } from "@swissgeo/map";
import PrintJobListing from "~/components/debug/PrintJobListing.vue";
import { usePrintFraming } from "~/composables/usePrintFraming";
import {
  printFixedScales,
  printFormats,
  printModes,
  printOrientations,
} from "~/types/print";

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const { zoomLevel } = useMap();
const {
  selectedPrintFormat,
  selectedPrintOrientation,
  selectedPrintMode,
  selectedPrintScale,
  isFixedScale,
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

const printModeItems = printModes.map((mode) => ({
  label:
    mode === "wysiwyg" ? t("print.modeWysiwyg") : t("print.modeFixedScale"),
  value: mode,
}));

const printScaleItems = printFixedScales.map(({ scale }) => ({
  label: `1:${scale.toLocaleString("de-CH")}`,
  value: scale,
}));

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
      <UButton
        color="primary"
        variant="ghost"
        icon="i-lucide-x"
        @click="handleClose"
      />
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
        :label="t('print.printModeLabel')"
        class="w-72"
      >
        <USelect v-model="selectedPrintMode" :items="printModeItems" />
      </UFormField>

      <UFormField
        v-if="isFixedScale"
        orientation="horizontal"
        :label="t('print.printScaleLabel')"
        class="w-72"
      >
        <USelect v-model="selectedPrintScale" :items="printScaleItems" />
      </UFormField>

      <UFormField
        orientation="horizontal"
        :label="t('print.lockCenterToViewLabel')"
        class="w-72"
      >
        <USwitch id="lock-center-checkbox" v-model="isCenterLocked" />
      </UFormField>

      <UFormField
        v-if="!isFixedScale"
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
        color="primary"
        variant="outline"
        @click="adjustToLockedView"
        >{{ t("print.zoomToLockedZoomLevel") }}</UButton
      >
      <UButton
        v-if="!isPrintExtentOutOfBounds"
        color="primary"
        variant="solid"
        @click="updatePrintState"
        >{{ t("print.sendPrintRequest") }}</UButton
      >
      <PrintJobListing />
    </div>
  </div>
</template>
