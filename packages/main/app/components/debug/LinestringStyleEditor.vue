<script setup lang="ts">
import { useDrawing } from "@swissgeo/drawing";
import { useMap } from "@swissgeo/map";

const { olMap } = useMap();
const { strokeColor, strokeWidth, focusedFeatureMetrics } = useDrawing(
  olMap.value!,
);

const lengthMeters = computed(() => {
  if (!focusedFeatureMetrics.value) {
    return 0;
  }
  return "lengthMeters" in focusedFeatureMetrics.value
    ? Math.round(focusedFeatureMetrics.value.lengthMeters * 100) / 100
    : 0;
});
</script>

<template>
  <div class="rounded border border-gray-300 bg-gray-50 p-4">
    <h3 class="mb-4 text-base font-semibold">Linestring Style</h3>
    <!-- Stroke Color -->
    <div class="mb-3">
      <label class="mb-1 block text-sm font-medium text-gray-900"
        >Stroke Color</label
      >
      <div class="flex gap-2">
        <input
          type="color"
          v-model="strokeColor"
          class="h-8 w-12 cursor-pointer rounded border border-gray-300"
        />
      </div>
    </div>
    <!-- Stroke Width -->
    <div>
      <label class="mb-1 block text-sm font-medium text-gray-900"
        >Stroke Width</label
      >
      <input
        type="number"
        v-model="strokeWidth"
        class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        min="0"
        step="1"
      />
    </div>
    <div>Length: {{ lengthMeters }}m</div>
  </div>
</template>
