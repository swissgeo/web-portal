<template>
  <div
    v-if="focusedFeature"
    class="rounded border border-gray-300 bg-gray-50 p-4"
  >
    <h3 class="mb-4 text-base font-semibold">Linestring Style</h3>
    <!-- Stroke Color -->
    <div class="mb-3">
      <label class="mb-1 block text-sm font-medium text-gray-900"
        >Stroke Color</label
      >
      <div class="flex gap-2">
        <input
          type="color"
          :value="strokeColor"
          class="h-8 w-12 cursor-pointer rounded border border-gray-300"
          @input="setStrokeColor($event.target.value)"
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
        :value="strokeWidth"
        class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        min="0"
        step="1"
        @input="setStrokeWidth(Number($event.target.value))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDrawing } from "@swissgeo/drawing";
import { useMap } from "@swissgeo/map";

const { olMap } = useMap();
const {
  focusedFeature,
  setStrokeColor,
  strokeColor,
  setStrokeWidth,
  strokeWidth,
} = useDrawing(olMap.value!);
</script>
