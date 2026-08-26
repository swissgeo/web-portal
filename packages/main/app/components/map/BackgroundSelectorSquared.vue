<script setup lang="ts">
import type { Layer } from "@swissgeo/layers";

import { CircleChevronRight } from "@lucide/vue";

import useBackgroundSelector from "./useBackgroundSelector";

const { backgroundLayers, currentBackgroundLayer } = defineProps<{
  backgroundLayers: (Layer | null)[];
  currentBackgroundLayer: Layer | null | undefined;
}>();

const emit = defineEmits<{
  selectBackground: [backgroundLayer: Layer | null];
}>();

function isCurrent(backgroundLayer: Layer | null) {
  if (backgroundLayer === null || currentBackgroundLayer === null) {
    return backgroundLayer === currentBackgroundLayer;
  } else {
    return backgroundLayer?.uuid === currentBackgroundLayer?.uuid;
  }
}

function selectBackgroundCallback(backgroundLayer: Layer | null): void {
  // don't update if it's the same already, otherwise the user has a little
  // flicker and unnecessary computation power is used
  if (isCurrent(backgroundLayer)) {
    return;
  }
  emit("selectBackground", backgroundLayer);
}

function layerKey(layer: Layer | null): string {
  return layer === null ? "void" : layer.uuid;
}

const { selectorOpen, toggleShowSelector, onSelectBackground } =
  useBackgroundSelector(selectBackgroundCallback);
</script>

<template>
  <div
    class="bg-selector fixed right-4 bottom-4 flex items-end gap-2 max-tablet:hidden"
  >
    <!--
            Each entry is animated individually so it can fly out from the trigger position.
            --reverse-index: 0 = closest to trigger (appears/disappears first), higher = further away.
            The translateX starting value is (reverse-index + 1) * button-step, which puts every
            button on top of the trigger before the transition kicks in.
        -->
    <TransitionGroup name="bg-option" tag="div" class="flex gap-2">
      <MapBackgroundSelectorEntry
        v-for="backgroundLayer in selectorOpen ? backgroundLayers : []"
        :key="layerKey(backgroundLayer)"
        :background-layer="backgroundLayer"
        :is-current="isCurrent(backgroundLayer)"
        @click="onSelectBackground(backgroundLayer)"
      />
    </TransitionGroup>
    <MapBackgroundSelectorEntry
      :background-layer="currentBackgroundLayer"
      :folded="selectorOpen"
      :is-current="false"
      @click="toggleShowSelector"
    >
      <template v-slot="slotProps">
        <Transition name="bg-toggle-icon">
          <div
            v-if="slotProps.folded"
            class="absolute inset-0 flex items-center justify-center rounded bg-[#343a40] text-white opacity-75"
          >
            <CircleChevronRight />
          </div>
        </Transition>
      </template>
    </MapBackgroundSelectorEntry>
  </div>
</template>

<style scoped>
.bg-option-enter-active,
.bg-option-leave-active {
  transition: opacity 0.15s ease;
}

.bg-option-enter-from,
.bg-option-leave-to {
  opacity: 0;
}

/* Fade the close-chevron overlay on the trigger button */
.bg-toggle-icon-enter-active,
.bg-toggle-icon-leave-active {
  transition: opacity 0.2s ease;
}

.bg-toggle-icon-enter-from,
.bg-toggle-icon-leave-to {
  opacity: 0;
}
</style>
