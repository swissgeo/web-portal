<script setup lang="ts">
import type { Map as OlMap } from "ol";
import type { Ref } from "vue";

import Overlay from "ol/Overlay";
import { inject, onMounted, onUnmounted, ref, watch } from "vue";

import { useOlMapContextMenu } from "../composables/useOlMapContextMenu.composable";

const olMap = inject<Ref<OlMap | undefined>>("olMap");
const { isVisible, coordinate, close } = useOlMapContextMenu();

const popupEl = ref<HTMLDivElement>();
let overlay: Overlay | null = null;

function setupOverlay() {
  overlay = new Overlay({
    element: popupEl.value,
    positioning: "top-center",
    offset: [0, 10],
    stopEvent: true,
  });
  // The watch is intentionally nested here so it only runs once the overlay instance exists.
  watch(
    () => olMap?.value,
    (map) => {
      if (map) {
        map.addOverlay(overlay);
      }
    },
    { immediate: true },
  );
}

onMounted(() => {
  setupOverlay();
});

watch([isVisible, coordinate], ([visible, coord]) => {
  if (visible && coord) {
    overlay?.setPosition(coord);
  } else {
    overlay?.setPosition(undefined);
  }
});

onUnmounted(() => olMap?.value?.removeOverlay(overlay));
</script>

<template>
  <div @click.right.stop ref="popupEl" class="w-96">
    <slot :coordinate="coordinate" :is-visible="isVisible" :close="close" />
  </div>
</template>
