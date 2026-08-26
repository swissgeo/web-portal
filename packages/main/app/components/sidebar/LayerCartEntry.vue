<script lang="ts" setup>
import type { Layer as MapLayer } from "@swissgeo/map";

import {
  getDisplayNameFromTimestamp,
  useDimensionsStore,
} from "@swissgeo/dimension";
import { useLayerStore } from "@swissgeo/layers";
import { useDatasetPanelStore } from "@swissgeo/skeleton";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import LayerCartIconButton from "./LayerCartIconButton.vue";

const { layer, layerIndex } = defineProps<{
  layer: MapLayer;
  layerIndex: number;
}>();

const { t } = useI18n();
const layerStore = useLayerStore();
const dimensionsStore = useDimensionsStore();
const datasetPanelStore = useDatasetPanelStore();
const mapViewStore = useMapViewStore();
const isExpanded = ref(true);

const backgroundLayerOffset = computed(() =>
  layerStore.backgroundLayer ? 1 : 0,
);
const canMoveUp = computed(
  () => layerIndex < mapViewStore.mapLayers.length - 1,
);
const canMoveDown = computed(() => layerIndex > backgroundLayerOffset.value);
const detailsId = computed(() => "layer-details-" + layer.uuid);
const displayName = computed(() => layer.displayName || layer.layerId);

const currentTime = computed<string | undefined>({
  get() {
    return (
      dimensionsStore.getDimensions(layer.uuid)?.time?.currentValue ?? undefined
    );
  },
  set(value) {
    dimensionsStore.setDimension(layer.uuid, "time", {
      currentValue: value ?? null,
    });
  },
});

const availableTimes = computed(() => {
  return dimensionsStore.getDimensions(layer.uuid)?.time?.availableValues ?? [];
});

const timeItems = computed(() =>
  availableTimes.value.map((value) => ({
    label: String(getDisplayNameFromTimestamp(value)),
    value,
  })),
);

const opacityPercent = computed(() => Math.round((layer.opacity ?? 1) * 100));

const reorderItems = computed(() => [
  {
    label: t("layerPanel.moveUp"),
    icon: "i-lucide-arrow-up",
    disabled: !canMoveUp.value,
    onSelect: moveUp,
  },
  {
    label: t("layerPanel.moveDown"),
    icon: "i-lucide-arrow-down",
    disabled: !canMoveDown.value,
    onSelect: moveDown,
  },
]);

function handleOpacityChange(value: number | undefined) {
  mapViewStore.updateLayerOpacity(layerIndex, (value ?? 0) / 100);
}

function toggleVisibility() {
  mapViewStore.toggleVisibility(layerIndex);
}

function moveUp() {
  mapViewStore.moveLayerUp(layerIndex);
}

function moveDown() {
  mapViewStore.moveLayerDown(layerIndex);
}

function removeLayer() {
  dimensionsStore.clearLayerDimensions(layer.uuid);
  layerStore.removeLayer(layer.uuid);
  mapViewStore.removeLayer(layerIndex);
}

function openDatasetPanel() {
  const source = layerStore.getLayer(layer.uuid);
  if (source) {
    datasetPanelStore.openDatasetPanel(source.humanId);
  }
}

function isFromDataset() {
  return layerStore.getLayer(layer.uuid)?.type === "dataset";
}
</script>

<template>
  <li class="w-full min-w-0">
    <article
      class="flex w-full min-w-0 flex-col gap-1.5 rounded-md py-1 pr-2 pl-1"
      :class="isExpanded && 'bg-elevated'"
    >
      <div class="flex h-5 min-w-0 items-center gap-1.5">
        <UDropdownMenu :items="reorderItems">
          <LayerCartIconButton
            :disabled="!canMoveUp && !canMoveDown"
            icon="i-lucide-grip-vertical"
            :label="t('layerPanel.reorder')"
            size="medium"
          />
        </UDropdownMenu>

        <LayerCartIconButton
          :aria-controls="detailsId"
          :aria-expanded="isExpanded"
          :icon="
            isExpanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'
          "
          :label="
            t(isExpanded ? 'layerPanel.collapse' : 'layerPanel.expand', {
              name: displayName,
            })
          "
          size="medium"
          tone="highlighted"
          @click="isExpanded = !isExpanded"
        />

        <span
          class="min-w-0 flex-1 truncate font-editorial text-sm/5 font-medium"
          :class="layer.isVisible ? 'text-highlighted' : 'text-muted'"
          :title="displayName"
        >
          {{ displayName }}
        </span>

        <LayerCartIconButton
          :icon="layer.isVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          :label="
            t(layer.isVisible ? 'layerPanel.hide' : 'layerPanel.show', {
              name: displayName,
            })
          "
          @click="toggleVisibility"
        />
        <LayerCartIconButton
          v-if="isFromDataset()"
          icon="i-lucide-info"
          :label="t('layerPanel.information', { name: displayName })"
          @click="openDatasetPanel"
        />
        <LayerCartIconButton
          icon="i-lucide-trash-2"
          :label="t('layerPanel.remove', { name: displayName })"
          tone="danger"
          @click="removeLayer"
        />
      </div>

      <div
        v-if="isExpanded"
        :id="detailsId"
        class="flex min-w-0 flex-col gap-2 pl-[26px]"
      >
        <label
          v-if="timeItems.length > 1"
          class="flex min-w-0 flex-col gap-1 text-[10px]/[18px] font-medium text-default"
        >
          {{ t("layerPanel.time") }}
          <USelect
            v-model="currentTime"
            :items="timeItems"
            class="w-full"
            size="xs"
          />
        </label>

        <label
          class="flex min-w-0 flex-col gap-1 text-[10px]/[18px] font-medium text-default"
        >
          <span>{{ t("layerPanel.opacity") }}</span>
          <USlider
            :model-value="opacityPercent"
            :min="0"
            :max="100"
            size="xs"
            @update:model-value="handleOpacityChange"
          />
        </label>
      </div>
    </article>
  </li>
</template>
