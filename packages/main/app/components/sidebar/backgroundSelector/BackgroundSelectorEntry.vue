<script setup lang="ts">
import type { Layer } from "@swissgeo/layers";
import type { Dataset } from "@swissgeo/ogc";

import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { AVAILABLE_BACKGROUNDS } from "./constants";
import useBackgroundSelector from "./useBackgroundSelector";

const { backgroundLayer, isCurrent = true } = defineProps<{
  backgroundLayer: Layer | null | undefined;
  isCurrent: boolean;
}>();
const { t } = useI18n();
const { getImageForBackgroundLayer } = useBackgroundSelector(() => {});

const emit = defineEmits(["click"]);
const testId = computed(
  () =>
    `background-selector-${backgroundLayer ? backgroundLayer.humanId : "void"}`,
);
const layerTranslationKey = computed(() =>
  mapBackgroundLayerToTranslationKey(backgroundLayer),
);

function mapBackgroundLayerToTranslationKey(
  layer: Layer | null | undefined,
): string {
  let translationKey = "";

  if (layer === null || layer === undefined) {
    translationKey = "backgroundLayers.voidMap";
  } else {
    const layerData = layer.data as Dataset;

    if (layerData.id === AVAILABLE_BACKGROUNDS.greyMap) {
      translationKey = `backgroundLayers.greyMap`;
    } else if (layerData.id === AVAILABLE_BACKGROUNDS.colorMap) {
      translationKey = `backgroundLayers.colorMap`;
    } else if (layerData.id === AVAILABLE_BACKGROUNDS.swissimage) {
      translationKey = `backgroundLayers.swissimage`;
    }
  }
  return t(translationKey);
}
</script>

<template>
  <button
    class="group relative rounded-lg border-2 border-accent-active"
    type="button"
    :data-testid="testId"
    @click="emit('click')"
  >
    <div class="absolute inset-0">
      <img
        v-if="backgroundLayer !== null && backgroundLayer !== undefined"
        :src="getImageForBackgroundLayer(backgroundLayer)"
        alt=""
        class="h-full w-full rounded-md object-cover"
      />
    </div>
    <div
      class="bg-opacity-50 bg-accent absolute right-0 bottom-0 left-0 mx-1 mb-1 h-6 content-center rounded-sm px-2 text-left text-xs font-medium text-inverted group-hover:bg-accent-hover"
      :class="{ 'bg-accent-active': isCurrent }"
    >
      {{ layerTranslationKey }}
    </div>
  </button>
</template>

<style scoped></style>
