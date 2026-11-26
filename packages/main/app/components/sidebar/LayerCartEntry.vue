<script lang="ts" setup>
// TODO : map view store alterations
import type { Layer as MapLayer } from "@swissgeo/map";
import type { DatasetTab } from "~/utils/datasetTab";

import {
  CURRENT_YEAR_TIMESTAMP,
  getDisplayNameFromTimestamp,
  useDimensionsStore,
} from "@swissgeo/dimension";
import { useFeaturesStore } from "@swissgeo/feature";
import { isDatasetLayer, useLayerStore } from "@swissgeo/layers";
import { computed, useId } from "vue";
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

const isExpanded = computed({
  get: () => mapViewStore.isLayerExpanded(layer.uuid),
  set: (expanded: boolean) =>
    mapViewStore.setLayerExpanded(layer.uuid, expanded),
});
const detailsId = useId();
const legends = computed(() => mapViewStore.getLayerLegends(layer.uuid));

const currentTime = computed({
  get() {
    return (
      dimensionsStore.getDimensions(layer.uuid)?.time?.currentValue ?? undefined
    );
  },
  set(value: string | undefined) {
    dimensionsStore.setDimension(layer.uuid, "time", {
      currentValue: value ?? null,
    });
  },
});

const timeItems = computed(() =>
  (dimensionsStore.getDimensions(layer.uuid)?.time?.availableValues ?? []).map(
    (time) => ({
      // "current" is a keyword, not a year: show it in the user's language
      label:
        time === CURRENT_YEAR_TIMESTAMP
          ? t("layers.timeCurrent")
          : String(getDisplayNameFromTimestamp(time)),
      value: time,
    }),
  ),
);

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

const legendLink = computed(() => {
  if (!detailPath.value) {
    return undefined;
  }
  return {
    path: detailPath.value,
    query: { tab: "legend" satisfies DatasetTab },
  };
});

// Shared look of the buttons on the entry row
const rowButton = {
  size: "xs",
  color: "accent",
  variant: "ghost",
  class: "p-0",
} as const;
const largeIcon = { leadingIcon: "size-5" };
</script>

<template>
  <li
    class="flex min-w-0 flex-col gap-2 rounded-sm"
    :class="{ 'bg-elevated pb-2': isExpanded }"
  >
    <div class="flex min-w-0 items-start gap-1.5 py-1 pr-2 pl-1">
      <UButton
        data-testid="layer-reorder-handle"
        data-vaul-no-drag
        class="layer-reorder-handle shrink-0 cursor-grab"
        icon="i-lucide-grip-vertical"
        v-bind="rowButton"
        :ui="largeIcon"
        :title="t('layers.reorder')"
        @keydown.up.prevent="moveUp()"
        @keydown.down.prevent="moveDown()"
      />
      <UButton
        data-testid="layer-expand-toggle"
        class="shrink-0"
        :class="{ 'text-accent-active': isExpanded }"
        :icon="isExpanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
        :title="isExpanded ? t('layers.collapse') : t('layers.expand')"
        :aria-expanded="isExpanded"
        :aria-controls="detailsId"
        v-bind="rowButton"
        :ui="largeIcon"
        @click="isExpanded = !isExpanded"
      />
      <button
        type="button"
        class="min-w-0 flex-1 cursor-pointer self-center text-left text-sm leading-small-text font-medium wrap-anywhere"
        :title="fullTitle"
        :aria-expanded="isExpanded"
        :aria-controls="detailsId"
        :class="[
          isExpanded ? 'text-accent-active' : 'text-accent truncate',
          { 'text-dimmed!': !layer.isVisible },
        ]"
        @click="isExpanded = !isExpanded"
      >
        {{ layer.displayName }}
      </button>
      <div class="flex shrink-0 items-center gap-1.5">
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
      class="flex min-w-0 flex-col gap-3 pr-2 pl-8"
    >
      <LayerVariantSelect
        v-if="datasetLayer?.data.properties.aggregated"
        :dataset="datasetLayer.data"
        :selected-distribution-id="datasetLayer.selectedDistributionId"
        @select="selectVariant"
      />
      <div v-if="timeItems.length > 1" class="flex flex-col gap-1">
        <span class="text-tiny font-medium text-default">
          {{ t("layers.time") }}
        </span>
        <USelect
          v-model="currentTime"
          data-testid="layer-time-select"
          :aria-label="t('layers.time')"
          data-vaul-no-drag
          :items="timeItems"
          size="xs"
          :ui="{
            base: 'py-0.5 text-xs ring-0 hover:bg-default hover:ring-1 hover:ring-accented',
            trailingIcon: 'text-accent',
          }"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-tiny font-medium text-default">
          {{ t("layers.opacity") }}
        </span>
        <USlider
          data-vaul-no-drag
          :model-value="opacityPercent"
          @update:model-value="handleOpacityChange"
          @wheel.prevent="handleWheel"
          :min="0"
          :max="100"
          size="xs"
          :ui="{ track: 'h-1.5 bg-default', thumb: 'ring-1' }"
        />
      </div>
      <LayerLegend :legends="legends" :detail-link="legendLink" />
    </div>
  </li>
</template>
