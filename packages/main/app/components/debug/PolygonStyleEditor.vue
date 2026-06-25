<script setup lang="ts">
import type { PolygonMetrics } from "@swissgeo/drawing";

import { useDrawing } from "@swissgeo/drawing";

const { fillColor, strokeColor, strokeWidth, focusedFeatureMetrics } =
  useDrawing();
</script>

<template>
  <div class="rounded border border-gray-300 bg-gray-50 p-4">
    <h3 class="mb-4 text-base font-semibold">Polygon Style</h3>
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
        />
      </div>
    </div>
    <!-- Stroke Color -->
    <div class="mb-3 flex items-center gap-3">
      <label class="mb-1 text-sm font-medium text-gray-900">Stroke Color</label>
      <div class="flex gap-2">
        <input
          type="color"
          v-model="strokeColor"
          class="h-8 w-12 cursor-pointer rounded border border-gray-300"
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
      />
    </div>
    <div v-if="focusedFeatureMetrics">
      Perimeter:
      {{
        Math.round((focusedFeatureMetrics as PolygonMetrics).perimeterMeters)
      }}
      m
    </div>
    <div v-if="focusedFeatureMetrics">
      Area:
      {{
        Math.round((focusedFeatureMetrics as PolygonMetrics).areaSquareMeters)
      }}
      m²
    </div>
  </div>
</template>
