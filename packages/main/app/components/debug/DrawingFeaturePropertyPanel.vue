<template>
  <div
    v-if="focusedFeature"
    class="flex flex-col gap-2 rounded border border-gray-300 bg-gray-50 p-4"
  >
    <UTextarea
      size="xl"
      placeholder="Description..."
      :rows="4"
      class="w-full"
    ></UTextarea>
    <PolygonStyleEditor v-if="focusedFeatureType === 'Polygon'" />
    <CircleStyleEditor v-if="focusedFeatureType === 'Circle'" />
    <LinestringStyleEditor v-if="focusedFeatureType === 'LineString'" />
    <div>Number of features: {{ numberOfFeatures }}</div>
    <textarea
      v-if="focusedFeatureMetrics"
      :value="JSON.stringify(focusedFeatureMetrics, null, 2)"
      readonly
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import { useDrawing } from "@swissgeo/drawing";
import { useMap } from "@swissgeo/map";

import LinestringStyleEditor from "./LinestringStyleEditor.vue";
import PolygonStyleEditor from "./PolygonStyleEditor.vue";
import CircleStyleEditor from "./CircleStyleEditor.vue";
const { olMap } = useMap();
const {
  focusedFeature,
  focusedFeatureType,
  focusedFeatureMetrics,
  numberOfFeatures,
} = useDrawing(olMap.value!);
</script>
