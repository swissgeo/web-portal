<script lang="ts" setup>
// TODO : map view store alterations
import type { Layer as MapLayer } from "@swissgeo/map";

import {
  getDisplayNameFromTimestamp,
  useDimensionsStore,
} from "@swissgeo/dimension";
import { useFeaturesStore } from "@swissgeo/feature";
import { isDatasetLayer, useLayerStore } from "@swissgeo/layers";
import { computed, ref, useId } from "vue";
import { useI18n } from "vue-i18n";

import LayerLegend from "./LayerLegend.vue";
import LayerVariantSelect from "./LayerVariantSelect.vue";

const { layer, layerIndex } = defineProps<{
  layer: MapLayer;
  layerIndex: number;
}>();

const { t } = useI18n();
const layerStore = useLayerStore();
const dimensionsStore = useDimensionsStore();
// const drawingStore = useDrawingStore();
const localePath = useLocalePath();
const mapViewStore = useMapViewStore();
const featureStore = useFeaturesStore();

const isExpanded = ref(false);
const detailsId = useId();
const legends = computed(() => mapViewStore.getLayerLegends(layer.uuid));

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

function handleWheel(event: WheelEvent) {
  let newOpacity = 0;

  if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
    const delta = event.deltaX > 0 ? -1 : 1;
    newOpacity = Math.min(Math.max(opacityPercent.value + delta, 0), 100);
  }

  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
    const delta = event.deltaY > 0 ? -1 : 1;
    newOpacity = Math.min(Math.max(opacityPercent.value + delta, 0), 100);
  }

  handleOpacityChange(newOpacity);
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
  featureStore.clearWmsCapability(layer.uuid);
  // Removing the source layer unmounts its converter. The converter then removes
  // the matching layer from the map-view store.
  layerStore.removeLayer(layer.uuid);
}

const datasetLayer = computed(() => {
  const source = layerStore.getLayer(layer.uuid);
  if (!source || !isDatasetLayer(source)) {
    return undefined;
  }
  return source;
});

const datasetId = computed(() => datasetLayer.value?.humanId);
// The list shows the short title. The tooltip shows the full title.
const fullTitle = computed(
  () => datasetLayer.value?.data.properties.title ?? layer.displayName,
);

function selectVariant(distributionId: string) {
  // Each variant has its own time values and feature info service.
  // Remove the values of the old variant. The converter sets the new ones.
  dimensionsStore.clearLayerDimensions(layer.uuid);
  featureStore.clearWmsCapability(layer.uuid);
  layerStore.setSelectedDistributionId(layer.uuid, distributionId);
}

const detailPath = computed(() => {
  if (!datasetId.value) {
    return undefined;
  }
  return localePath(`/dataset/${datasetId.value}`);
});

// Shared look of the buttons on the entry row
const rowButton = {
  size: "xs",
  color: "primary",
  variant: "ghost",
  ui: { base: "hover:text-primary-400 dark:hover:text-primary-200" },
} as const;
</script>

<template>
  <li class="flex min-w-0 flex-col gap-2 rounded">
    <div class="flex min-w-0 items-start">
      <UButton
        data-testid="layer-reorder-handle"
        data-vaul-no-drag
        class="layer-reorder-handle shrink-0 cursor-grab text-dimmed"
        icon="i-lucide-grip-vertical"
        v-bind="rowButton"
        :title="t('layers.reorder')"
        @keydown.up.prevent="moveUp()"
        @keydown.down.prevent="moveDown()"
      />
      <UButton
        data-testid="layer-expand-toggle"
        class="shrink-0"
        :icon="isExpanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
        :title="isExpanded ? t('layers.collapse') : t('layers.expand')"
        :aria-expanded="isExpanded"
        :aria-controls="detailsId"
        v-bind="rowButton"
        @click="isExpanded = !isExpanded"
      />
      <button
        type="button"
        class="min-w-0 flex-1 cursor-pointer px-1 text-left"
        :title="fullTitle"
        :aria-expanded="isExpanded"
        :aria-controls="detailsId"
        :class="{ truncate: !isExpanded, 'text-dimmed': !layer.isVisible }"
        @click="isExpanded = !isExpanded"
      >
        {{ layer.displayName }}
      </button>
      <div class="flex shrink-0 items-center">
        <select
          v-if="(availableTimes?.length || 0) > 1"
          v-model="currentTime"
          class="max-w-24 bg-elevated"
        >
          <option v-for="time in availableTimes" :value="time" :key="time">
            {{ getTimestampName(time) }}
          </option>
        </select>
        <UButton
          :icon="layer.isVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
          :title="layer.isVisible ? t('layers.hide') : t('layers.show')"
          v-bind="rowButton"
          @click="toggleVisibility()"
        />
        <UButton
          v-if="detailPath"
          icon="i-lucide-info"
          :title="t('layers.info')"
          v-bind="rowButton"
          :to="detailPath"
        />
        <UButton
          icon="i-lucide-trash-2"
          :title="t('layers.remove')"
          v-bind="rowButton"
          @click="removeLayer"
        />
      </div>
    </div>

    <div
      v-if="isExpanded"
      :id="detailsId"
      class="flex min-w-0 flex-col gap-3 pl-8"
    >
      <LayerVariantSelect
        v-if="datasetLayer?.data.properties.aggregated"
        :dataset="datasetLayer.data"
        :selected-distribution-id="datasetLayer.selectedDistributionId"
        @select="selectVariant"
      />
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium text-toned uppercase">
          {{ t("layers.opacity") }}
        </span>
        <div class="flex items-center gap-2">
          <USlider
            data-vaul-no-drag
            :model-value="opacityPercent"
            @update:model-value="handleOpacityChange"
            @wheel.prevent="handleWheel"
            :min="0"
            :max="100"
            class="flex-1"
          />
          <span class="w-8 text-xs text-toned">{{ opacityPercent }}%</span>
        </div>
      </div>
      <LayerLegend :legends="legends" />
    </div>
  </li>
</template>
