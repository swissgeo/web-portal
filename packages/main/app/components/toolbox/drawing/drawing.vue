<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

import {
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  Circle as CircleIcon,
  CloudUpload as CloudUploadIcon,
  Copy as CopyIcon,
  CopyCheck as CopyCheckIcon,
  Download as DownloadIcon,
  MapPin as MapPinIcon,
  MousePointer2 as MousePointer2Icon,
  Pentagon as PentagonIcon,
  Scan as ScanIcon,
  Spline as SplineIcon,
  Trash2 as Trash2Icon,
  Type as TypeIcon,
  X as XIcon,
} from "@lucide/vue";
import { useDrawing } from "@swissgeo/drawing";
import log from "@swissgeo/log";
import { useMap } from "@swissgeo/map";
import { useClipboard } from "@vueuse/core";
import { useToolboxStore } from "~/stores/toolbox";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { useShareDrawings } from "@/composables/useShareDrawings";

import FeaturePropertyPanel from "./FeaturePropertyPanel.vue";

const toolboxStore = useToolboxStore();

const { t } = useI18n();

const { olMap } = useMap();

const { copy, copied } = useClipboard();

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
  serializeAllFeaturesAsBlob,
  drawingAdminId,
  drawingS3Url,
  drawingId,
} = useDrawing();

const shareDrawingAsAdmin = ref(false);

const drawingShareableString = computed(() => {
  if (!drawingS3Url.value || !drawingAdminId.value) {
    return "";
  }

  const shareUrl = new URL(drawingS3Url.value);

  if (shareDrawingAsAdmin.value) {
    shareUrl.hash = drawingAdminId.value;
  }

  return shareUrl.toString();
});

const { shareDrawings, isSharing } = useShareDrawings();

const emit = defineEmits<{
  close: [];
}>();

const drawingTools = [
  {
    id: "polyline",
    label: "Line",
    icon: SplineIcon,
    geometry: "LineString",
  },
  {
    id: "polygon",
    label: "Polygon",
    icon: PentagonIcon,
    geometry: "Polygon",
  },
  {
    id: "circle",
    label: "Circle",
    icon: CircleIcon,
    geometry: "Circle",
  },
  { id: "text", label: "Text", icon: TypeIcon, geometry: "Point" },
  {
    id: "marker",
    label: "Marker",
    icon: MapPinIcon,
    geometry: "Point",
  },
] as const;

const activeTool = ref("");

function selectTool() {
  activeTool.value = "select";
  enableSelectInteraction();
}

function startDrawing(tool: (typeof drawingTools)[number]) {
  activeTool.value = tool.id;
  enableDrawInteraction(tool.geometry);
}

watch(focusMode, (mode) => {
  if (mode !== "create") {
    activeTool.value = mode === "select" ? "select" : "";
  }
});

const toolHint = computed(() => {
  if (focusMode.value === "edit") {
    return "Drag the handles to reshape your feature.";
  }
  if (focusMode.value === "select" || activeTool.value === "select") {
    return "Select a feature on the map to edit its style.";
  }
  if (focusMode.value !== "create") {
    return "Choose a tool to start drawing on the map.";
  }
  if (activeTool.value === "text" || activeTool.value === "marker") {
    return "Click on the map to place your feature.";
  }
  if (activeTool.value === "circle") {
    return "Click to set the centre, then click to set the radius.";
  }
  return "Click to add points. Double-click to finish.";
});

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
 * Triggers a download of all features in the drawing layer in the specified format.
 */
async function exportAllFeatures(
  format: "geojson" | "gpx-track" | "gpx-route" | "kml" | "kmz" = "geojson",
) {
  try {
    const blob = await serializeAllFeaturesAsBlob(format);
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
  } catch (_error) {
    log.error("Failed to export all features");
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

// Watch for changes in focus mode and share drawings when focus mode is set to 'none'.
watch(focusMode, async (newFocusMode) => {
  if (newFocusMode !== "none") {
    return;
  }

  // If the drawing has never been shared explicitely by the user, it is not synced automatically.
  if (!drawingId && !drawingAdminId) {
    return;
  }

  await shareDrawings();
});

function terminateModification() {
  disableAllInteractions();
  removeFocus();
}

function cancelDrawing() {
  disableAllInteractions();
  removeFocusedFeature();
  removeFocus();
}

async function onShareDrawings() {
  await shareDrawings();
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
  <UCard
    data-testid="toolbox-drawing-card"
    class="flex max-h-full min-h-0 flex-col overflow-hidden"
    :ui="{
      header: 'shrink-0',
      body: 'min-h-0 overflow-y-auto overscroll-contain',
      footer: 'shrink-0',
    }"
  >
    <template #header>
      <div class="flex items-start justify-between">
        <div class="flex items-baseline gap-2">
          <div class="font-semibold text-highlighted">
            {{ t("toolbox.drawing.title") }}
          </div>
          <span class="text-xs text-muted" data-testid="drawing-feature-count">
            {{ numberOfFeatures }}
            {{ numberOfFeatures === 1 ? "feature" : "features" }} on the map
          </span>
        </div>

        <UButton
          color="primary"
          variant="ghost"
          :icon="XIcon"
          size="xs"
          :aria-label="t('toolbox.drawing.close')"
          @click="toolboxStore.closeDetailPanel()"
        />
      </div>
    </template>

    <div class="space-y-4">
      <template v-if="focusMode === 'none'">
        <div
          class="grid grid-cols-3 gap-1.5 rounded-lg border border-default bg-elevated/50 p-1.5"
          role="group"
          aria-label="Drawing tools"
        >
          <UButton
            color="neutral"
            variant="ghost"
            :icon="MousePointer2Icon"
            class="min-h-18 flex-col justify-center gap-2 rounded-lg text-xs transition-colors"
            :class="
              activeTool === 'select'
                ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                : 'text-toned'
            "
            :ui="{ leadingIcon: 'size-5' }"
            :aria-pressed="activeTool === 'select'"
            :disabled="numberOfFeatures === 0"
            data-testid="select-feature-tool"
            @click="selectTool"
            >Select</UButton
          >
          <UButton
            v-for="tool in drawingTools"
            :key="tool.id"
            color="neutral"
            variant="ghost"
            :icon="tool.icon"
            class="min-h-18 flex-col justify-center gap-2 rounded-lg text-xs transition-colors"
            :class="
              activeTool === tool.id
                ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                : 'text-toned'
            "
            :ui="{ leadingIcon: 'size-5' }"
            :aria-pressed="activeTool === tool.id"
            :data-testid="`drawing-tool-${tool.id}`"
            @click="startDrawing(tool)"
            >{{ tool.label }}</UButton
          >
        </div>

        <p
          class="flex items-start gap-2 text-xs leading-relaxed text-muted"
          role="status"
        >
          <UIcon
            name="i-lucide-info"
            mode="svg"
            class="mt-0.5 size-3.5 shrink-0"
          />
          {{ toolHint }}
        </p>
      </template>

      <template v-if="focusMode === 'create'">
        <p class="text-center text-xs text-muted">
          You are currently drawing a new feature.
        </p>
        <UButton
          color="neutral"
          variant="outline"
          :icon="XIcon"
          block
          data-testid="cancel-drawing-tool"
          @click="cancelDrawing"
          >Cancel drawing</UButton
        >
      </template>

      <template v-if="focusMode === 'select' && focusedFeature">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold tracking-wide text-muted uppercase"
              >Selection</span
            >
            <UButton
              color="primary"
              variant="soft"
              size="xs"
              :icon="CheckIcon"
              data-testid="deselect-feature-tool"
              @click="terminateModification"
              >Done</UButton
            >
          </div>
          <FeaturePropertyPanel />
          <div class="flex gap-2">
            <UButton
              color="neutral"
              variant="outline"
              :icon="ScanIcon"
              class="flex-1 justify-center"
              data-testid="modify-geometry-tool"
              @click="enableModifyInteraction"
              >Edit geometry</UButton
            >
            <UButton
              color="error"
              variant="soft"
              :icon="Trash2Icon"
              data-testid="delete-feature-tool"
              @click="removeFocusedFeature"
              >Delete</UButton
            >
          </div>
        </div>
      </template>

      <template v-if="focusMode === 'edit' && focusedFeature">
        <UButton
          color="primary"
          variant="solid"
          :icon="CheckIcon"
          block
          data-testid="finish-modification-tool"
          @click="terminateModification"
          >Finish editing</UButton
        >
        <p
          v-if="
            focusedFeatureType === 'LineString' ||
            focusedFeatureType === 'Polygon'
          "
          class="text-xs text-muted"
        >
          Shift + click a point to delete it.
        </p>
      </template>
    </div>

    <template v-if="focusMode === 'none'" #footer>
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <UDropdownMenu
            v-if="numberOfFeatures > 0"
            arrow
            :items="exportAllFeaturesItems"
            :ui="{ content: 'w-48' }"
          >
            <UButton
              label="Export"
              :icon="DownloadIcon"
              :trailing-icon="ChevronDownIcon"
              color="neutral"
              variant="outline"
              size="sm"
            />
          </UDropdownMenu>
          <UButton
            color="primary"
            variant="soft"
            :icon="CloudUploadIcon"
            size="sm"
            :loading="isSharing"
            @click="onShareDrawings"
            >Sync drawing</UButton
          >
          <UTooltip
            v-if="focusMode === 'none' && numberOfFeatures > 0"
            text="Clear drawing layer"
          >
            <UButton
              color="error"
              variant="ghost"
              :icon="Trash2Icon"
              size="sm"
              class="ml-auto"
              aria-label="Clear drawing layer"
              data-testid="drawing-tool-clear"
              @click="clearDrawingLayer"
            />
          </UTooltip>
        </div>
        <div
          v-if="drawingShareableString"
          class="space-y-2 border-t border-default pt-3"
        >
          <label for="drawing-share-link" class="text-xs font-medium text-toned"
            >Share link</label
          >
          <UInput
            id="drawing-share-link"
            :model-value="drawingShareableString"
            class="w-full"
            :disabled="isSharing"
            readonly
            :ui="{ trailing: 'pr-0.5' }"
          >
            <template #trailing>
              <UTooltip text="Copy to clipboard" :content="{ side: 'top' }">
                <UButton
                  :color="copied ? 'success' : 'neutral'"
                  variant="link"
                  size="sm"
                  :icon="copied ? CopyCheckIcon : CopyIcon"
                  aria-label="Copy to clipboard"
                  @click="copy(drawingShareableString)"
                />
              </UTooltip>
            </template>
          </UInput>
          <USwitch
            v-model="shareDrawingAsAdmin"
            size="sm"
            label="Allow editing"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>
