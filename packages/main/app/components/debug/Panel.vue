<script lang="ts" setup>
import DrawingPanel from "~/components/debug/DrawingPanel.vue";
import ImportDrawingPanel from "~/components/debug/ImportDrawingPanel.vue";

const isExpanded = ref(false);
const toggleIcon = computed(() =>
  isExpanded.value ? "i-lucide-chevron-down" : "i-lucide-chevron-up",
);

const isLayersPanelOpen = ref(false);
const isImportPanelOpen = ref(false);
const isImportLocalPanelOpen = ref(false);
const isImportDrawingOpen = ref(false);
const isDrawingOpen = ref(false);
const isSharePanelOpen = ref(false);
const isPrintPanelOpen = ref(false);

function toggleLayersPanel() {
  isLayersPanelOpen.value = !isLayersPanelOpen.value;
}

function toggleImportPanel() {
  isImportPanelOpen.value = !isImportPanelOpen.value;
}
function toggleLocalImportPanel() {
  isImportLocalPanelOpen.value = !isImportLocalPanelOpen.value;
}
function toggleImportDrawing() {
  isImportDrawingOpen.value = !isImportDrawingOpen.value;
}
function toggleDrawing() {
  isDrawingOpen.value = !isDrawingOpen.value;
}
function toggleStateConfig() {
  isSharePanelOpen.value = !isSharePanelOpen.value;
}

function togglePrintPanel() {
  isPrintPanelOpen.value = !isPrintPanelOpen.value;
}
</script>

<template>
  <div class="flex max-w-full flex-col items-center">
    <UButton
      color="primary"
      variant="solid"
      :icon="toggleIcon"
      aria-label="Debug"
      title="Debug"
      :aria-expanded="isExpanded"
      aria-controls="debug-panel-content"
      class="h-6 w-16 justify-center self-end rounded-b-none px-0 py-0 shadow-md"
      @click="isExpanded = !isExpanded"
    />
    <div
      id="debug-panel-content"
      v-show="isExpanded"
      class="max-h-[60dvh] max-w-full overflow-auto bg-default p-2 shadow-md"
    >
      <DebugLayersPanel
        class="relative h-[300px] w-[800px] overflow-hidden bg-default text-default shadow"
        v-if="isLayersPanelOpen"
        @close="toggleLayersPanel"
      ></DebugLayersPanel>
      <DebugImportLayersPanel
        class="relative h-[300px] w-[800px] overflow-hidden bg-white shadow"
        v-if="isImportPanelOpen"
        @close="toggleImportPanel"
      >
      </DebugImportLayersPanel>
      <DebugImportLocalLayersPanel
        class="relative h-[300px] w-[800px] overflow-hidden bg-white shadow"
        v-if="isImportLocalPanelOpen"
        @close="toggleLocalImportPanel"
      >
      </DebugImportLocalLayersPanel>

      <DrawingPanel
        class="relative h-[400px] w-[350px] overflow-hidden bg-white shadow"
        v-if="isDrawingOpen"
        @close="toggleDrawing"
      >
      </DrawingPanel>

      <ImportDrawingPanel
        class="relative h-[200px] w-[800px] overflow-hidden bg-white shadow"
        v-if="isImportDrawingOpen"
        @close="toggleImportDrawing"
      >
      </ImportDrawingPanel>

      <DebugSharePanel v-if="isSharePanelOpen" @close="toggleStateConfig" />
      <DebugFramePrintPanel v-if="isPrintPanelOpen" @close="togglePrintPanel" />
      <div
        class="flex flex-wrap justify-center gap-2"
        v-if="
          !isLayersPanelOpen &&
          !isImportPanelOpen &&
          !isImportLocalPanelOpen &&
          !isImportDrawingOpen &&
          !isDrawingOpen &&
          !isSharePanelOpen &&
          !isPrintPanelOpen
        "
      >
        <UButton color="primary" variant="outline" @click="toggleLayersPanel">
          {{ $t("debug.openLayersPanel") }}
        </UButton>
        <UButton
          data-testid="debug-open-import-layers-panel"
          color="primary"
          variant="outline"
          @click="toggleImportPanel"
        >
          {{ $t("debug.openImportLayersPanel") }}
        </UButton>
        <UButton
          data-testid="debug-open-import-local-panel"
          color="primary"
          variant="outline"
          @click="toggleLocalImportPanel"
        >
          {{ $t("debug.openImportLocalLayersPanel") }}
        </UButton>
        <UButton
          data-testid="debug-open-import-drawing-panel"
          color="primary"
          variant="outline"
          @click="toggleImportDrawing"
        >
          {{ $t("debug.openImportDrawingPanel") }}
        </UButton>
        <UButton
          data-testid="debug-open-drawing-panel"
          color="primary"
          variant="outline"
          @click="toggleDrawing"
        >
          {{ $t("debug.openDrawingPanel") }}
        </UButton>
        <UButton color="primary" variant="outline" @click="toggleStateConfig">
          {{ $t("debug.openStateConfigPanel") }}
        </UButton>
        <UButton color="primary" variant="outline" @click="togglePrintPanel">
          {{ $t("debug.openPrintPanel") }}
        </UButton>
      </div>
    </div>
  </div>
</template>
