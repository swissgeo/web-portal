<script setup lang="ts">
import { useDrawing } from "@swissgeo/drawing";

const { fillColor, strokeColor, strokeWidth, focusedFeatureMetrics } =
  useDrawing();
import type { CircleMetrics } from "@swissgeo/drawing";
</script>

<template>
  <div
    class="rounded border border-gray-300 bg-gray-50 p-4"
    data-testid="circle-style-editor"
  >
    <h3 class="mb-4 text-base font-semibold">Circle Style</h3>
    <!-- Fill Color -->
    <div class="mb-3 flex items-center gap-3">
      <label class="mb-1 block text-sm font-medium text-gray-900"
        >Fill Color</label
      >
      <div class="flex gap-2">
        <input
          type="color"
          v-model="fillColor"
          class="h-8 w-12 cursor-pointer rounded border border-gray-300"
          data-testid="circle-fill-color"
        />
      </div>
    </div>
    <!-- Stroke Color -->
    <div class="mb-3 flex items-center gap-3">
      <label class="mb-1 block text-sm font-medium text-gray-900"
        >Stroke Color</label
      >
      <div class="flex gap-2">
        <input
          type="color"
          v-model="strokeColor"
          class="h-8 w-12 cursor-pointer rounded border border-gray-300"
          data-testid="circle-stroke-color"
        />
      </div>
    </div>
    <!-- Stroke Width -->
    <div class="mb-3 flex items-center gap-3">
      <label class="mb-1 block text-sm font-medium text-gray-900"
        >Stroke Width</label
      >
      <input
        type="number"
        v-model.number="strokeWidth"
        class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        min="0"
        step="1"
        data-testid="circle-stroke-width"
      />
    </div>
    <div v-if="focusedFeatureMetrics" data-testid="circle-perimeter">
      Perimeter:
      {{ Math.round((focusedFeatureMetrics as CircleMetrics).perimeterMeters) }}
      m
    </div>
    <div v-if="focusedFeatureMetrics" data-testid="circle-radius">
      Radius:
      {{ Math.round((focusedFeatureMetrics as CircleMetrics).radiusMeters) }}
      m
    </div>
    <div v-if="focusedFeatureMetrics" data-testid="circle-area">
      Area:
      {{
        Math.round((focusedFeatureMetrics as CircleMetrics).areaSquareMeters)
      }}
      m²
    </div>
  </div>
</template>
