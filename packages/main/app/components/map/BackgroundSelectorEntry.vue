<script lang="ts" setup>
import type { Layer } from "@swissgeo/layers";
import type { Dataset } from "@swissgeo/ogc";

import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { AVAILABLE_BACKGROUNDS } from "./constants";
import useBackgroundSelector from "./useBackgroundSelector";

const {
  backgroundLayer,
  isCurrent = false,
  folded = false,
} = defineProps<{
  backgroundLayer: Layer | null | undefined;
  isCurrent: boolean;
  folded?: boolean;
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

    if (layerData.id === AVAILABLE_BACKGROUNDS[0]) {
      translationKey = `backgroundLayers.greyMap`;
    } else if (layerData.id === AVAILABLE_BACKGROUNDS[1]) {
      translationKey = `backgroundLayers.colorMap`;
    } else if (layerData.id === AVAILABLE_BACKGROUNDS[2]) {
      translationKey = `backgroundLayers.swissimage`;
    }
  }
  return t(translationKey);
}
</script>

<template>
  <button
    class="bg-entry relative overflow-hidden rounded-lg border-4 border-solid border-[#343a40]"
    :class="{ active: isCurrent, folded }"
    type="button"
    :data-testid="testId"
    @click="emit('click')"
  >
    <span
      class="bg-entry-image flex h-[65px] items-center justify-center overflow-hidden"
    >
      <img
        class="h-full w-full object-cover"
        :src="getImageForBackgroundLayer(backgroundLayer)"
        alt="background image"
      />
    </span>
    <slot :folded="folded" />
    <span
      class="bg-entry-label absolute right-0 bottom-0 left-0 bg-[rgba(52,58,64,0.75)]"
    >
      <span class="block text-xs text-white">
        {{ layerTranslationKey }}
      </span>
    </span>
  </button>
</template>

<style scoped>
.bg-entry {
  width: 98px;
  transition:
    width 0.3s ease,
    border-color 0.2s ease;
}

.bg-entry.folded {
  width: 39px;
}

.bg-entry.active {
  border-color: #dc2626;
}

.bg-entry-image {
  width: 90px;
  transition: width 0.3s ease;
}

.bg-entry.folded .bg-entry-image {
  width: 31px;
}

.bg-entry-label {
  transition: opacity 0.2s ease;
}

.bg-entry.folded .bg-entry-label {
  opacity: 0;
  pointer-events: none;
}

@media (max-width: 480px) {
  .bg-entry {
    width: 72px;
  }

  .bg-entry.folded {
    width: 32px;
  }

  .bg-entry-image {
    width: 64px;
  }

  .bg-entry.folded .bg-entry-image {
    width: 24px;
  }
}
</style>
