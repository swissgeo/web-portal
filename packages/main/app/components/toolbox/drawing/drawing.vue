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
  serializeAllFeaturesAsBlob,
  drawingAdminId,
  drawingId,
} = useDrawing();

const shareDrawingAsAdmin = ref(false);
const runtimeConfig = useRuntimeConfig();

const drawingShareableString = computed(() => {
  if (!drawingId.value || !drawingAdminId.value) {
    return "";
  }

  const shareUrl = new URL(
    `${runtimeConfig.public.drawingServiceEndpoint}/${drawingId.value}`,
  );
  shareUrl.hash = shareDrawingAsAdmin.value ? drawingAdminId.value : "";
  return shareUrl.toString();
});

const { shareDrawings, isSharing } = useShareDrawings();

const drawingTools = [
  {
    id: "polyline",
    label: "toolbox.drawing.tools.polyline",
    icon: SplineIcon,
    geometry: "LineString",
  },
  {
    id: "polygon",
    label: "toolbox.drawing.tools.polygon",
    icon: PentagonIcon,
    geometry: "Polygon",
  },
  {
    id: "circle",
    label: "toolbox.drawing.tools.circle",
    icon: CircleIcon,
    geometry: "Circle",
  },
  {
    id: "text",
    label: "toolbox.drawing.tools.text",
    icon: TypeIcon,
    geometry: "Point",
  },
  {
    id: "marker",
    label: "toolbox.drawing.tools.marker",
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
  if (tool.geometry === "Point") {
    enableDrawInteraction(tool.geometry, tool.id);
    return;
  }
  enableDrawInteraction(tool.geometry);
}

watch(focusMode, (mode) => {
  if (mode !== "create") {
    activeTool.value = mode === "select" ? "select" : "";
  }
});

const toolHint = computed(() => {
  if (focusMode.value === "edit") {
    return t("toolbox.drawing.hints.edit");
  }
  if (focusMode.value === "select" || activeTool.value === "select") {
    return t("toolbox.drawing.hints.select");
  }
  if (focusMode.value !== "create") {
    return t("toolbox.drawing.hints.chooseTool");
  }
  if (activeTool.value === "text" || activeTool.value === "marker") {
    return t("toolbox.drawing.hints.place");
  }
  if (activeTool.value === "circle") {
    return t("toolbox.drawing.hints.circle");
  }
  return t("toolbox.drawing.hints.addPoints");
});

/**
 * Drops down elements for exporting all features in the drawing layer in various formats.
 */
const exportAllFeaturesItems = computed<DropdownMenuItem[]>(() => [
  {
    label: t("toolbox.drawing.formats.geojson"),
    onClick: () => exportAllFeatures("geojson"),
  },
  {
    label: t("toolbox.drawing.formats.gpxTrack"),
    onClick: () => exportAllFeatures("gpx-track"),
  },
  {
    label: t("toolbox.drawing.formats.gpxRoute"),
    onClick: () => exportAllFeatures("gpx-route"),
  },
  {
    label: t("toolbox.drawing.formats.kml"),
    onClick: () => exportAllFeatures("kml"),
  },
  {
    label: t("toolbox.drawing.formats.kmz"),
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

// Watch for changes in focus mode and share drawings when focus mode is set to 'none'.
watch(focusMode, async (newFocusMode) => {
  if (newFocusMode !== "none") {
    return;
  }

  // If the drawing has never been shared explicitely by the user, it is not synced automatically.
  if (!drawingId.value && !drawingAdminId.value) {
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
            {{ t("toolbox.drawing.featureCount", numberOfFeatures) }}
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
          :aria-label="t('toolbox.drawing.tools.label')"
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
            >{{ t("toolbox.drawing.tools.select") }}</UButton
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
            >{{ t(tool.label) }}</UButton
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
          {{ t("toolbox.drawing.hints.drawing") }}
        </p>
        <UButton
          color="neutral"
          variant="outline"
          :icon="XIcon"
          block
          data-testid="cancel-drawing-tool"
          @click="cancelDrawing"
          >{{ t("toolbox.drawing.cancel") }}</UButton
        >
      </template>

      <template v-if="focusMode === 'select' && focusedFeature">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold tracking-wide text-muted uppercase"
              >{{ t("toolbox.drawing.selection") }}</span
            >
            <UButton
              color="primary"
              variant="soft"
              size="xs"
              :icon="CheckIcon"
              data-testid="deselect-feature-tool"
              @click="terminateModification"
              >{{ t("toolbox.drawing.done") }}</UButton
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
              >{{ t("toolbox.drawing.editGeometry") }}</UButton
            >
            <UButton
              color="error"
              variant="soft"
              :icon="Trash2Icon"
              data-testid="delete-feature-tool"
              @click="removeFocusedFeature"
              >{{ t("toolbox.drawing.delete") }}</UButton
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
          >{{ t("toolbox.drawing.finishEditing") }}</UButton
        >
        <p
          v-if="
            focusedFeatureType === 'LineString' ||
            focusedFeatureType === 'Polygon'
          "
          class="text-xs text-muted"
        >
          {{ t("toolbox.drawing.hints.deletePoint") }}
        </p>
      </template>
    </div>

    <template v-if="focusMode === 'none'" #footer>
      <div class="flex flex-col gap-2">
        <div
          v-if="drawingShareableString"
          class="space-y-2 border-b border-default pb-3"
        >
          <label
            for="drawing-share-link"
            class="text-xs font-medium text-toned"
            >{{ t("toolbox.drawing.shareLink") }}</label
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
              <UTooltip
                :text="t('toolbox.drawing.copy')"
                :content="{ side: 'top' }"
              >
                <UButton
                  :color="copied ? 'success' : 'neutral'"
                  variant="link"
                  size="sm"
                  :icon="copied ? CopyCheckIcon : CopyIcon"
                  :aria-label="t('toolbox.drawing.copy')"
                  @click="copy(drawingShareableString)"
                />
              </UTooltip>
            </template>
          </UInput>
          <USwitch
            v-model="shareDrawingAsAdmin"
            size="sm"
            :label="t('toolbox.drawing.allowEditing')"
          />
        </div>
        <UButton
          v-else
          class="w-full justify-center"
          color="primary"
          variant="soft"
          :icon="CloudUploadIcon"
          size="sm"
          :loading="isSharing"
          @click="onShareDrawings"
          >{{ t("toolbox.drawing.sync") }}</UButton
        >
        <UDropdownMenu
          :disabled="numberOfFeatures === 0"
          arrow
          :items="exportAllFeaturesItems"
        >
          <UButton
            :label="t('toolbox.drawing.export')"
            :icon="DownloadIcon"
            :trailing-icon="ChevronDownIcon"
            color="primary"
            variant="soft"
            size="sm"
            class="w-full justify-center whitespace-nowrap"
          />
        </UDropdownMenu>
        <UButton
          color="error"
          :disabled="numberOfFeatures === 0"
          variant="soft"
          :icon="Trash2Icon"
          size="sm"
          class="ml-auto w-full justify-center whitespace-nowrap"
          :aria-label="t('toolbox.drawing.clear')"
          data-testid="drawing-tool-clear"
          @click="clearDrawingLayer"
          >{{ t("toolbox.drawing.clear") }}</UButton
        >
      </div>
    </template>
  </UCard>
</template>
