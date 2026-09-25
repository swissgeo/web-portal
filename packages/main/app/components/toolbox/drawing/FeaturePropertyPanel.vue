<script setup lang="ts">
import { useDrawing } from "@swissgeo/drawing";

import CircleStyleEditor from "./CircleStyleEditor.vue";
import LinestringStyleEditor from "./LinestringStyleEditor.vue";
import PointStyleEditor from "./PointStyleEditor.vue";
import PolygonStyleEditor from "./PolygonStyleEditor.vue";
const { focusedFeature, focusedFeatureType, title, description } = useDrawing();
</script>

<template>
  <div
    v-if="focusedFeature"
    :key="focusedFeature?.getId()"
    class="flex flex-col gap-2 rounded border border-gray-300 bg-gray-50 p-4"
    data-testid="drawing-feature-property-panel"
  >
    <div data-testid="drawing-feature-type">{{ focusedFeatureType }}</div>
    <UInput v-model="title" data-testid="drawing-feature-title" />
    <UTextarea
      size="xl"
      placeholder="Description..."
      :rows="4"
      class="w-full"
      v-model="description"
      data-testid="drawing-feature-description"
    ></UTextarea>
    <PolygonStyleEditor v-if="focusedFeatureType === 'Polygon'" />
    <CircleStyleEditor v-if="focusedFeatureType === 'Circle'" />
    <LinestringStyleEditor v-if="focusedFeatureType === 'LineString'" />
    <PointStyleEditor v-if="focusedFeatureType === 'Point'" />
  </div>
</template>
