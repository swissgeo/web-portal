<template>
  <div
    v-if="focusedFeature"
    :key="focusedFeature?.getId()"
    class="flex flex-col gap-2 rounded border border-gray-300 bg-gray-50 p-4"
  >
    <div>{{ focusedFeatureType }}</div>
    <UInput v-model="title" />
    <UTextarea
      size="xl"
      placeholder="Description..."
      :rows="4"
      class="w-full"
      v-model="description"
    ></UTextarea>
    <PolygonStyleEditor v-if="focusedFeatureType === 'Polygon'" />
    <CircleStyleEditor v-if="focusedFeatureType === 'Circle'" />
    <LinestringStyleEditor v-if="focusedFeatureType === 'LineString'" />
    <PointStyleEditor v-if="focusedFeatureType === 'Point'" />
  </div>
</template>

<script setup lang="ts">
import { useDrawing } from "@swissgeo/drawing";
import { useMap } from "@swissgeo/map";

import CircleStyleEditor from "./CircleStyleEditor.vue";
import LinestringStyleEditor from "./LinestringStyleEditor.vue";
import PointStyleEditor from "./PointStyleEditor.vue";
import PolygonStyleEditor from "./PolygonStyleEditor.vue";
const { olMap } = useMap();
const { focusedFeature, focusedFeatureType, title, description } = useDrawing(
  olMap.value!,
);
</script>
