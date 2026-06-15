<script setup lang="ts">
import type { Map } from "ol";

import { useDrawing } from "@swissgeo/drawing";
import { useMap } from "@swissgeo/map";
import { IconButton } from "@swissgeo/skeleton";

import LinestringStyleEditor from "./LinestringStyleEditor.vue";
import PolygonStyleEditor from "./PolygonStyleEditor.vue";

const { t } = useI18n();

const { olMap } = useMap();

const {
  disableAllInteractions,
  enableSelectInteraction,
  enableModifyInteraction,
  removeFocus,
  enableDrawInteraction,
  removeFocusedFeature,
  focusedFeatureType,
  focusedFeatureMetrics,
  numberOfFeatures,
  focusMode,
  focusedFeature,
} = useDrawing(olMap.value);

const emit = defineEmits<{
  close: [];
}>();

function handleClose() {
  emit("close");
}

function terminateModification() {
  disableAllInteractions();
  removeFocus();
}

function cancelDrawing() {
  disableAllInteractions();
  removeFocusedFeature();
  removeFocus();
}

onUnmounted(() => {
  disableAllInteractions();
  removeFocus();
});
</script>

<template>
  <div
    class="relative flex h-full flex-col bg-white p-4 shadow-lg"
    data-testid="drawing-panel"
  >
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-semibold">{{ t("debug.drawingPanelTitle") }}</h3>
      <IconButton iconName="X" @click="handleClose" severity="secondary" />
    </div>

    <div class="mb-4">
      <PolygonStyleEditor
        v-if="
          focusedFeatureType === 'Circle' || focusedFeatureType === 'Polygon'
        "
      />
      <LinestringStyleEditor v-if="focusedFeatureType === 'LineString'" />
      <textarea
        v-if="focusedFeatureMetrics"
        :value="JSON.stringify(focusedFeatureMetrics, null, 2)"
        readonly
      ></textarea>
      <div class="grid grid-cols-2 gap-2">
        <UButton
          v-if="focusMode === 'none'"
          color="primary"
          variant="solid"
          data-testid="drawing-tool-polyline"
          @click="enableDrawInteraction('LineString')"
        >
          Create polyline
        </UButton>
        <UButton
          v-if="focusMode === 'none'"
          color="primary"
          variant="solid"
          data-testid="drawing-tool-polygon"
          @click="enableDrawInteraction('Polygon')"
        >
          Create polygon
        </UButton>
        <UButton
          v-if="focusMode === 'none'"
          color="primary"
          variant="solid"
          data-testid="drawing-tool-circle"
          @click="enableDrawInteraction('Circle')"
        >
          Create circle
        </UButton>
        <UButton
          v-if="focusMode === 'none'"
          color="primary"
          variant="solid"
          data-testid="drawing-tool-point"
          @click="enableDrawInteraction('Point')"
        >
          Create point
        </UButton>

        <UButton
          v-if="focusMode === 'none' && numberOfFeatures > 0"
          color="primary"
          variant="solid"
          data-testid="select-tool"
          @click="enableSelectInteraction"
        >
          Select feature
        </UButton>

        <UButton
          v-if="focusMode === 'create'"
          color="error"
          variant="solid"
          data-testid="select-tool"
          @click="cancelDrawing"
        >
          Cancel drawing
        </UButton>

        <UButton
          v-if="focusMode === 'select' && focusedFeature"
          color="primary"
          variant="solid"
          data-testid="modify-tool"
          @click="enableModifyInteraction"
        >
          Modify selected feature
        </UButton>

        <UButton
          v-if="focusMode === 'edit' && focusedFeature"
          color="primary"
          variant="solid"
          data-testid="modify-tool"
          @click="terminateModification"
        >
          Finish modification
        </UButton>

        <UButton
          v-if="focusMode === 'select' && focusedFeature"
          color="error"
          variant="solid"
          data-testid="modify-tool"
          @click="removeFocusedFeature"
        >
          Delete selected feature
        </UButton>
      </div>
    </div>
  </div>
</template>
