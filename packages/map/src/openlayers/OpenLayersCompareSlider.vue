<script lang="ts" setup>
import type { Map as OlMapType } from "ol";
import type { EventsKey } from "ol/events";
import type RenderEvent from "ol/render/Event";
import type { Ref } from "vue";

import { unByKey } from "ol/Observable";
import { getRenderPixel } from "ol/render";
import { inject, onBeforeUnmount, ref, watch } from "vue";

import type { Layer } from "@/types/layers";

import useCompareSliderControl from "@/composables/useCompareSliderControl.composable";

/**
 * Draggable vertical bar that "swipes" between one layer and the layers
 * underneath it. As the user drags, `clippedLayer` is clipped to the left of the
 * bar (using OpenLayers' prerender/postrender canvas events), revealing whatever
 * is rendered below it on the right.
 *
 * The component is meant to be slotted inside the map (where `olMap` is
 * provided). The engine-agnostic parts (ratio state, positioning, dragging) live
 * in `useCompareSliderControl`; this component only adds the OpenLayers-specific
 * layer clipping on top of it.
 */

const { compareRatio, clippedLayer } = defineProps<{
  compareRatio: number;
  /** The layer that should be clipped, identified by its OL properties. */
  clippedLayer?: Pick<Layer, "layerId" | "uuid" | "displayName">;
}>();

const emit = defineEmits<{
  "update:compareRatio": [ratio: number];
}>();

const olMap = inject<Ref<OlMapType | undefined>>("olMap");

const showLayerName = ref(false);

const { localRatio, sliderStyle, grabSlider } = useCompareSliderControl({
  compareRatio: () => compareRatio,
  getMapElement: () => olMap?.value?.getViewport(),
  onRatioChange: () => olMap?.value?.render(),
  onCommit: (ratio) => emit("update:compareRatio", ratio),
});

/**
 * We can only attach the clipping events to a layer once OpenLayers has actually
 * added it to the map. At startup (or for slow external layers) the layer can be
 * the chosen clip target before it exists on the map, so binding has to wait for
 * the next `rendercomplete`. This holds the key of that pending one-shot listener
 * so we can cancel it if the clipped layer changes (or the component unmounts)
 * before it fires — otherwise the stale callback would clip the wrong layer.
 */
let pendingRenderKey: EventsKey | EventsKey[] | undefined;

function cancelPendingRegistration() {
  if (pendingRenderKey) {
    unByKey(pendingRenderKey);
    pendingRenderKey = undefined;
  }
}

// (un)register the clipping events whenever the clipped layer changes
watch(
  () => clippedLayer,
  (newLayer, oldLayer) => {
    // drop any registration still waiting on the previous clipped layer
    cancelPendingRegistration();
    if (oldLayer) {
      unRegisterRenderingEvents(oldLayer.layerId, oldLayer.uuid);
    }
    if (!newLayer) {
      return;
    }
    if (getLayerFromMap(newLayer.layerId, newLayer.uuid)) {
      registerRenderingEvents(newLayer.layerId, newLayer.uuid);
      olMap?.value?.render();
    } else {
      // The layer config can be updated before the layer is actually added to
      // the map (typically at startup, or for slow external layers). In that
      // case we wait for the next complete render to bind the clipping events,
      // otherwise the slider has no effect until the next interaction.
      pendingRenderKey = olMap?.value?.once("rendercomplete", () => {
        pendingRenderKey = undefined;
        registerRenderingEvents(newLayer.layerId, newLayer.uuid);
        olMap?.value?.render();
      });
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  cancelPendingRegistration();
  if (clippedLayer) {
    unRegisterRenderingEvents(clippedLayer.layerId, clippedLayer.uuid);
  }
  // clear any leftover clip from the canvas
  olMap?.value?.render();
});

function getLayerFromMap(layerId: string, uuid: string) {
  return olMap?.value
    ?.getAllLayers()
    .toSorted((a, b) => b.get("zIndex") - a.get("zIndex"))
    .find((layer) => layer.get("id") === layerId && layer.get("uuid") === uuid);
}

function registerRenderingEvents(layerId: string, uuid: string) {
  const layer = getLayerFromMap(layerId, uuid);
  layer?.on("prerender", onPreRender);
  layer?.on("postrender", onPostRender);
}

function unRegisterRenderingEvents(layerId: string, uuid: string) {
  const layer = getLayerFromMap(layerId, uuid);
  layer?.un("prerender", onPreRender);
  layer?.un("postrender", onPostRender);
}

/**
 * Duck-types a 2D canvas context. We don't rely on `instanceof
 * CanvasRenderingContext2D` because that global is not defined in non-browser
 * environments (e.g. tests). Every layer in this app currently renders to a 2D
 * canvas, so a `clip`-capable context is all we need; a non-2D context yields
 * `undefined` and clipping is simply skipped (no error).
 *
 * TODO(3D/COG): WebGL-rendered layers (COG via `WebGLTileLayer`, or 3D) have no
 * `clip()`, so the swipe would silently no-op on them. COG would need a WebGL
 * branch clipping via `gl.scissor` instead of `context.clip()`; 3D (Cesium) has
 * no per-layer canvas at all and would use a separate component driving Cesium's
 * `scene.splitPosition`. Neither layer type exists in the app yet.
 */
function as2dContext(
  context: RenderEvent["context"],
): CanvasRenderingContext2D | undefined {
  if (
    context &&
    typeof (context as CanvasRenderingContext2D).clip === "function"
  ) {
    return context as CanvasRenderingContext2D;
  }
  return undefined;
}

function onPreRender(event: RenderEvent) {
  const context = as2dContext(event.context);
  if (!context) {
    return;
  }
  // get the render coordinates of the bar so clipping is correct on hi-dpi
  const cssWidth = olMap?.value?.getSize()?.[0] ?? 0;
  const right = getRenderPixel(event, [localRatio.value * cssWidth, 0])[0];

  context.save();
  context.beginPath();
  context.rect(0, 0, right, context.canvas.height);
  context.clip();
}

function onPostRender(event: RenderEvent) {
  as2dContext(event.context)?.restore();
}
</script>

<template>
  <div
    class="fixed z-1 flex w-10 -translate-x-1/2 cursor-ew-resize touch-none items-center justify-center"
    :style="sliderStyle"
    data-testid="compare-slider"
    @mousedown.passive="grabSlider"
    @touchstart.passive="grabSlider"
    @mouseenter="showLayerName = true"
    @mouseleave="showLayerName = false"
  >
    <!-- the visible bar -->
    <div class="pointer-events-none h-full w-1 bg-primary"></div>
    <!-- round grab handle with the two facing chevrons -->
    <div
      class="pointer-events-none absolute flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow"
    >
      <svg
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="9 6 4 12 9 18" />
        <polyline points="15 6 20 12 15 18" />
      </svg>
    </div>
    <div
      v-if="showLayerName && clippedLayer?.displayName"
      class="absolute right-8 bottom-24 w-32 rounded bg-default px-2 py-1 text-xs break-words shadow"
      data-testid="compared-layer-name"
    >
      {{ clippedLayer.displayName }}
    </div>
  </div>
</template>
