<script setup lang="ts">
import type { Map as OlMap } from "ol";
import type { Coordinate } from "ol/coordinate";
import type { Ref } from "vue";

import Overlay from "ol/Overlay";
import { inject, onMounted, onUnmounted, ref, watch } from "vue";

import { useOlMapContextMenu } from "../composables/useOlMapContextMenu.composable";

const olMap = inject<Ref<OlMap | undefined>>("olMap");
const { isVisible, coordinate, close } = useOlMapContextMenu();

const popupEl = ref<HTMLDivElement>();
const MARGIN = 16;
const GAP = 10;
let overlay: Overlay | null = null;

function setupOverlay() {
  overlay = new Overlay({
    element: popupEl.value,
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

// The popup stays on screen without moving the map: it opens above the point
// in the lower half of the map, and shifts sideways near an edge.
function show(coord: Coordinate) {
  const map = olMap?.value;
  const pixel = map?.getPixelFromCoordinate(coord);
  const size = map?.getSize();
  if (!overlay || !pixel || !size) {
    return;
  }
  const dy = pixel[1] > size[1] / 2 ? -GAP : GAP;
  overlay.setPositioning(dy < 0 ? "bottom-center" : "top-center");
  overlay.setPosition(coord);
  const half = (popupEl.value?.offsetWidth ?? 0) / 2;
  const dx = Math.min(
    Math.max(0, MARGIN + half - pixel[0]),
    size[0] - MARGIN - half - pixel[0],
  );
  overlay.setOffset([dx, dy]);
}

watch([isVisible, coordinate], ([visible, coord]) => {
  if (visible && coord) {
    show(coord);
  } else {
    overlay?.setPosition(undefined);
  }
});

onUnmounted(() => olMap?.value?.removeOverlay(overlay));
</script>

<template>
  <div @click.right.stop ref="popupEl" class="w-96 max-w-[calc(100vw-2rem)]">
    <slot :coordinate="coordinate" :is-visible="isVisible" :close="close" />
  </div>
</template>
