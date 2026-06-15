<template>
  <div
    v-if="focusedFeature"
    class="rounded border border-gray-300 bg-gray-50 p-4"
  >
    <h3 class="mb-4 text-base font-semibold">Polygon Style</h3>
    <!-- Fill Color -->
    <div class="mb-3">
      <label class="mb-1 block text-sm font-medium text-gray-900"
        >Fill Color</label
      >
      <div class="flex gap-2">
        <input
          type="color"
          :value="fillColor"
          class="h-8 w-12 cursor-pointer rounded border border-gray-300"
          @input="setFillColor($event.target.value)"
        />
      </div>
    </div>
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
    <!-- <div>
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
    </div> -->
  </div>
  <div
    v-else
    class="rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-600"
  >
    <p>Select a polygon to edit its style</p>
  </div>
</template>

<script setup lang="ts">
import { useDrawing } from "@swissgeo/drawing";
import { useMap } from "@swissgeo/map";

const { olMap } = useMap();
const { focusedFeature, setFillColor, fillColor, setStrokeColor, strokeColor } =
  useDrawing(olMap.value!);
</script>
