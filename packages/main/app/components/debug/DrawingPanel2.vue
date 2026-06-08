<script setup lang="ts">
import { useDrawing } from "@swissgeo/drawing";
import { IconButton } from "@swissgeo/skeleton";

const { t } = useI18n();

const {
  disableAllInteractions,
  enableSelectInteraction,
  enableModifyInteraction,
  removeFocus,
  enableDrawInteraction,
  removeFocusedFeature,
  focusedFeatureType,
  numberOfFeatures,
  focusMode,
  focusedFeature,
  hasDrawInteractionOn,
} = useDrawing();

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
          v-if="focusMode === 'read' && focusedFeature"
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
          v-if="focusMode === 'read' && focusedFeature"
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
