<script lang="ts" setup>
import geoadminLayers from "~/assets/poc/geoadminLayers.json";
import DrawingPanel from "~/components/debug/DrawingPanel.vue";
import { useGeoadminGeoJsonLoader } from "~/composables/useGeoadminGeoJsonLoader";
import { useMapLibreGeoJsonDemo } from "~/composables/useMapLibreGeoJsonDemo";

const {
  addDemoLayer: addMapLibreGeoJsonDemo,
  addLegacyDemoLayer: addLegacyGeoJsonDemo,
} = useMapLibreGeoJsonDemo();

const { loadLayer } = useGeoadminGeoJsonLoader();
const selectedLayerId = ref<string>(geoadminLayers[0] ?? "");

const isLayersPanelOpen = ref(false);
const isImportPanelOpen = ref(false);
const isImportLocalPanelOpen = ref(false);
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
  <div>
    <DebugLayersPanel
      class="relative h-[300px] w-[800px] overflow-hidden bg-white shadow"
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

    <DebugSharePanel v-if="isSharePanelOpen" @close="toggleStateConfig" />
    <DebugFramePrintPanel v-if="isPrintPanelOpen" @close="togglePrintPanel" />
    <div
      class="flex gap-2"
      v-if="
        !isLayersPanelOpen &&
        !isImportPanelOpen &&
        !isImportLocalPanelOpen &&
        !isDrawingOpen &&
        !isSharePanelOpen &&
        !isPrintPanelOpen
      "
    >
      <UButton @click="toggleLayersPanel" class="cursor-pointer">
        {{ $t("debug.openLayersPanel") }}
      </UButton>
      <UButton @click="toggleImportPanel" class="cursor-pointer">
        {{ $t("debug.openImportLayersPanel") }}
      </UButton>
      <UButton @click="toggleLocalImportPanel" class="cursor-pointer">
        {{ $t("debug.openImportLocalLayersPanel") }}
      </UButton>
      <UButton data-testid="debug-open-drawing-panel" @click="toggleDrawing">
        {{ $t("debug.openDrawingPanel") }}
      </UButton>
      <UButton @click="toggleStateConfig">
        {{ $t("debug.openStateConfigPanel") }}
      </UButton>
      <UButton @click="togglePrintPanel">
        {{ $t("debug.openPrintPanel") }}
      </UButton>
      <UButton
        data-testid="debug-add-maplibre-geojson-demo"
        @click="addMapLibreGeoJsonDemo"
      >
        Add MapLibre GeoJSON demo
      </UButton>
      <UButton
        data-testid="debug-add-legacy-geojson-demo"
        @click="addLegacyGeoJsonDemo"
      >
        Add legacy GeoJSON demo
      </UButton>
      <select
        v-model="selectedLayerId"
        class="max-w-[260px] rounded border border-gray-300 bg-white px-2 text-sm"
        data-testid="debug-geojson-layer-select"
      >
        <option v-for="id in geoadminLayers" :key="id" :value="id">
          {{ id }}
        </option>
      </select>
      <UButton @click="loadLayer(selectedLayerId)"> Load (MapLibre) </UButton>
      <UButton @click="loadLayer(selectedLayerId, { legacy: true })">
        Load (legacy)
      </UButton>
    </div>
  </div>
</template>
