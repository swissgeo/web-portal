<script lang="ts" setup>
// TODO : map view store alterations
import type { Layer as MapLayer } from "@swissgeo/map";

import {
  getDisplayNameFromTimestamp,
  useDimensionsStore,
} from "@swissgeo/dimension";
import { useLayerStore } from "@swissgeo/layers";
import { useDatasetPanelStore, IconButton } from "@swissgeo/skeleton";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import LayerLegend from "./LayerLegend.vue";

const { layer, layerIndex } = defineProps<{
  layer: MapLayer;
  layerIndex: number;
}>();

const { t } = useI18n();
const layerStore = useLayerStore();
const dimensionsStore = useDimensionsStore();
// const drawingStore = useDrawingStore();
const datasetPanelStore = useDatasetPanelStore();
const mapViewStore = useMapViewStore();
const bgLayerModifier = computed(() => (layerStore.backgroundLayer ? 1 : 0));

const layersLength = computed(() => mapViewStore.mapLayers.length);

const isExpanded = ref(false);
const legends = computed(() => layerStore.getLayerLegends(layer.uuid));

const currentTime = computed({
  get() {
    return (
      dimensionsStore.getDimensions(layer.uuid)?.time?.currentValue ?? null
    );
  },
  set(value) {
    dimensionsStore.setDimension(layer.uuid, "time", { currentValue: value });
  },
});

const availableTimes = computed(() => {
  return dimensionsStore.getDimensions(layer.uuid)?.time?.availableValues ?? [];
});

const getTimestampName = (time: string) => {
  return getDisplayNameFromTimestamp(time);
};

// Opacity as percentage (0-100) for the slider
const opacityPercent = computed({
  get: () => Math.round((layer.opacity ?? 1) * 100),
  set: (value: number) => {
    handleOpacityChange(value / 100);
  },
});

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

function isFromDataSet() {
  return layerStore.getLayer(layer.uuid)?.type === "dataset";
}
</script>

<template>
  <li class="flex min-w-0 flex-col gap-2">
    <div class="flex min-w-0 items-center gap-1">
      <IconButton
        data-testid="layer-expand-toggle"
        class="shrink-0"
        :iconName="isExpanded ? 'Chevron-Down' : 'Chevron-Right'"
        :title="isExpanded ? t('layers.collapse') : t('layers.expand')"
        severity="secondary"
        @click="isExpanded = !isExpanded"
      />
      <div class="flex shrink-0">
        <IconButton
          :iconName="layer.isVisible ? 'Eye' : 'Eye-Off'"
          @click="toggleVisibility()"
          severity="secondary"
        />
        <div class="flex flex-col justify-between">
          <IconButton
            :disabled="layerIndex === layersLength - bgLayerModifier"
            iconName="Chevron-Up"
            severity="secondary"
            class="h-0.5"
            @click="moveUp()"
          ></IconButton>
          <IconButton
            :disabled="layerIndex === bgLayerModifier"
            iconName="Chevron-Down"
            severity="secondary"
            class="h-0.5"
            @click="moveDown()"
          ></IconButton>
        </div>
      </div>
      <div
        class="min-w-0 flex-1 truncate"
        :title="layer.displayName"
        :class="{ 'text-gray-300': !layer.isVisible }"
      >
        {{ layer.displayName }}
      </div>
      <div class="flex shrink-0 items-center">
        <div>
          <select
            v-if="(availableTimes?.length || 0) > 1"
            v-model="currentTime"
            class="max-w-24 bg-zinc-300"
          >
            <option v-for="time in availableTimes" :value="time" :key="time">
              {{ getTimestampName(time) }}
            </option>
          </select>
        </div>
        <IconButton
          v-if="isFromDataSet()"
          iconName="Info"
          severity="secondary"
          @click="openDatasetPanel"
        />
        <IconButton iconName="Trash" @click="removeLayer" />
      </div>
    </div>

    <div v-if="isExpanded" class="flex min-w-0 flex-col gap-3 pl-8">
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium text-gray-600 uppercase">
          {{ t("layers.transparency") }}
        </span>
        <div class="flex items-center gap-2">
          <USlider
            :model-value="opacityPercent"
            @update:model-value="handleOpacityChange"
            :min="0"
            :max="100"
            class="flex-1"
          />
          <span class="w-8 text-xs text-gray-600">{{ opacityPercent }}%</span>
        </div>
      </div>
      <LayerLegend :legends="legends" />
    </div>
  </li>
</template>
