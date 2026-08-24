<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type Feature from "ol/Feature";
import type { Geometry } from "ol/geom";

import { useDrawing, getFeatureTitle } from "@swissgeo/drawing";
import { useMap } from "@swissgeo/map";
import { IconButton } from "@swissgeo/skeleton";

import DrawingFeaturePropertyPanel from "./DrawingFeaturePropertyPanel.vue";

const { t } = useI18n();

const { olMap } = useMap();

const {
  disableAllInteractions,
  enableSelectInteraction,
  enableModifyInteraction,
  removeFocus,
  enableDrawInteraction,
  removeFocusedFeature,
  numberOfFeatures,
  focusMode,
  focusedFeature,
  focusedFeatureType,
  mountDrawingLayer,
  clearDrawingLayer,
  isDrawingLayerInLayerStore,
  serializeFocusedFeatureAsBlob,
  serializeAllFeaturesAsBlob,
} = useDrawing();

const emit = defineEmits<{
  close: [];
}>();

function handleClose() {
  emit("close");
}

/**
 * Dropdown elements for exporting the currently focused feature in various formats.
 */
const exportFocusedFeatureItems = ref<DropdownMenuItem[]>([
  {
    label: "GeoJSON",
    onClick: () => exportFocusedFeature("geojson"),
  },
  {
    label: "GPX Track",
    onClick: () => exportFocusedFeature("gpx-track"),
  },
  {
    label: "GPX Route",
    onClick: () => exportFocusedFeature("gpx-route"),
  },
  {
    label: "KML",
    onClick: () => exportFocusedFeature("kml"),
  },
  {
    label: "KMZ",
    onClick: () => exportFocusedFeature("kmz"),
  },
]);

/**
 * Drops down elements for exporting all features in the drawing layer in various formats.
 */
const exportAllFeaturesItems = ref<DropdownMenuItem[]>([
  {
    label: "GeoJSON",
    onClick: () => exportAllFeatures("geojson"),
  },
  {
    label: "GPX Track",
    onClick: () => exportAllFeatures("gpx-track"),
  },
  {
    label: "GPX Route",
    onClick: () => exportAllFeatures("gpx-route"),
  },
  {
    label: "KML",
    onClick: () => exportAllFeatures("kml"),
  },
  {
    label: "KMZ",
    onClick: () => exportAllFeatures("kmz"),
  },
]);

/**
 * Triggers a download of the currently focused feature in the specified format.
 */
function exportFocusedFeature(
  format: "geojson" | "gpx-track" | "gpx-route" | "kml" | "kmz" = "geojson",
) {
  if (!focusedFeature.value) {
    return;
  }

  const blob = serializeFocusedFeatureAsBlob(format);
  if (blob) {
    const featureTitle =
      getFeatureTitle(focusedFeature.value as Feature<Geometry>) || "feature";
    // make a filename that is safe for the filesystem by removing all characters that are not
    // letters, numbers, underscores, or hyphens, and replacing spaces with underscores
    const fileBasename = featureTitle
      .replace(/\s+/g, "_")
      .replace(/[^\p{L}\p{N}_-]/gu, "");

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileBasename}.${format.split("-")[0]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Triggers a download of all features in the drawing layer in the specified format.
 */
function exportAllFeatures(
  format: "geojson" | "gpx-track" | "gpx-route" | "kml" | "kmz" = "geojson",
) {
  const blob = serializeAllFeaturesAsBlob(format);
  if (blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scene.${format.split("-")[0]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * If the drawing layer is removed from the layer store, we should close the drawing panel, as it is no longer relevant.
 */
watch(
  isDrawingLayerInLayerStore,
  (isDrawingLayerPresentInStore, wasDrawingLayerPresentInStore) => {
    if (!isDrawingLayerPresentInStore && wasDrawingLayerPresentInStore) {
      emit("close");
    }
  },
);

function terminateModification() {
  disableAllInteractions();
  removeFocus();
}

function cancelDrawing() {
  disableAllInteractions();
  removeFocusedFeature();
  removeFocus();
}

onMounted(() => {
  mountDrawingLayer(olMap.value);
});

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
      <IconButton
        iconName="X"
        @click="handleClose"
        data-testid="drawing-panel-close"
      />
    </div>

    <div class="mb-4">
      <div class="grid grid-cols-1 gap-1">
        <div data-testid="drawing-feature-count">
          Number of features: {{ numberOfFeatures }}
        </div>
        <DrawingFeaturePropertyPanel
          v-if="focusedFeature && focusMode === 'select'"
        />
        <UButton
          v-if="focusMode === 'none' && numberOfFeatures > 0"
          color="primary"
          variant="outline"
          data-testid="select-feature-tool"
          @click="enableSelectInteraction"
        >
          Select feature
        </UButton>

        <UButton
          v-if="focusMode === 'none'"
          color="primary"
          variant="ghost"
          data-testid="drawing-tool-polyline"
          @click="enableDrawInteraction('LineString')"
        >
          Create polyline
        </UButton>
        <UButton
          v-if="focusMode === 'none'"
          color="primary"
          variant="ghost"
          data-testid="drawing-tool-polygon"
          @click="enableDrawInteraction('Polygon')"
        >
          Create polygon
        </UButton>
        <UButton
          v-if="focusMode === 'none'"
          color="primary"
          variant="ghost"
          data-testid="drawing-tool-circle"
          @click="enableDrawInteraction('Circle')"
        >
          Create circle
        </UButton>
        <UButton
          v-if="focusMode === 'none'"
          color="primary"
          variant="ghost"
          data-testid="drawing-tool-point"
          @click="enableDrawInteraction('Point')"
        >
          Create point
        </UButton>

        <UButton
          v-if="focusMode === 'create'"
          color="error"
          variant="outline"
          data-testid="cancel-drawing-tool"
          @click="cancelDrawing"
        >
          Cancel drawing
        </UButton>

        <UButton
          v-if="focusMode === 'select' && focusedFeature"
          color="primary"
          variant="ghost"
          data-testid="deselect-feature-tool"
          @click="terminateModification"
        >
          Deselect feature
        </UButton>

        <UButton
          v-if="focusMode === 'select' && focusedFeature"
          color="primary"
          variant="solid"
          data-testid="modify-geometry-tool"
          @click="enableModifyInteraction"
        >
          Modify selected feature's geometry
        </UButton>

        <UButton
          v-if="focusMode === 'edit' && focusedFeature"
          color="primary"
          variant="solid"
          data-testid="finish-modification-tool"
          @click="terminateModification"
        >
          Finish geometry modification
        </UButton>

        <UButton
          v-if="focusMode === 'select' && focusedFeature"
          color="error"
          variant="solid"
          data-testid="delete-feature-tool"
          @click="removeFocusedFeature"
        >
          Delete selected feature
        </UButton>

        <div
          v-if="
            focusMode === 'edit' &&
            focusedFeature &&
            (focusedFeatureType === 'LineString' ||
              focusedFeatureType === 'Polygon')
          "
          class="text-gray-400 italic"
        >
          (Shift + click on a point to delete it)
        </div>

        <UButton
          v-if="focusMode === 'none' && numberOfFeatures > 0"
          color="error"
          variant="solid"
          data-testid="drawing-tool-clear"
          @click="clearDrawingLayer"
        >
          Clear drawing layer
        </UButton>

        <UDropdownMenu
          v-if="focusedFeature"
          arrow
          :items="exportFocusedFeatureItems"
          :ui="{
            content: 'w-48',
          }"
        >
          <UButton
            label="Export feature"
            icon="i-lucide-save"
            color="primary"
            variant="outline"
          />
        </UDropdownMenu>

        <UDropdownMenu
          v-if="numberOfFeatures > 0"
          arrow
          :items="exportAllFeaturesItems"
          :ui="{
            content: 'w-48',
          }"
        >
          <UButton
            label="Export all features"
            icon="i-lucide-save"
            color="primary"
            variant="outline"
          />
        </UDropdownMenu>
      </div>
    </div>
  </div>
</template>
