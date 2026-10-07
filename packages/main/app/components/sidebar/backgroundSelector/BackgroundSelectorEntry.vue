<script setup lang="ts">
import type { Layer } from "@swissgeo/layers";

import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { getBackgroundTranslationKey } from "./constants";
import useBackgroundSelector from "./useBackgroundSelector";

const { backgroundLayer, isCurrent = true } = defineProps<{
  backgroundLayer: Layer | null | undefined;
  isCurrent: boolean;
}>();
const { t } = useI18n();
const { getImageForBackgroundLayer } = useBackgroundSelector(() => {});
const voidBackgroundImage = computed(
  () => `url(${getImageForBackgroundLayer(null)})`,
);

const emit = defineEmits(["click"]);
const testId = computed(
  () =>
    `background-selector-${backgroundLayer ? backgroundLayer.humanId : "void"}`,
);
const layerTranslationKey = computed(() =>
  t(getBackgroundTranslationKey(backgroundLayer)),
);
</script>

<template>
  <button
    class="group relative rounded-lg border-2 border-transparent hover:border-accent-active"
    :class="{ 'border-accent-active!': isCurrent }"
    type="button"
    :data-testid="testId"
    @click="emit('click')"
  >
    <div class="absolute inset-0 rounded-md bg-white">
      <img
        v-if="backgroundLayer !== null && backgroundLayer !== undefined"
        :src="getImageForBackgroundLayer(backgroundLayer)"
        alt=""
        class="h-full w-full rounded-md object-cover"
      />
      <div
        v-else
        class="void-background h-full w-full rounded-md object-cover"
      ></div>
    </div>
    <div
      class="bg-opacity-50 bg-accent absolute right-0 bottom-0 left-0 mx-1 mb-1 h-6 content-center rounded-sm px-2 text-left text-xs font-medium text-inverted group-hover:bg-accent-hover"
      :class="{ 'bg-accent-active': isCurrent }"
    >
      {{ layerTranslationKey }}
    </div>
  </button>
</template>

<style scoped>
.void-background {
  background-image: v-bind("voidBackgroundImage");
  background-repeat: repeat;
}
</style>
