<script lang="ts" setup>
import type { Feature as OGCFeature } from "@swissgeo/shared/ogc";
const { layerConfig } = defineProps<{ layerConfig: OGCFeature }>();

const zIndex = computed(() => 1);
</script>

<template>
  <OpenLayersWMTSLayer :layer="layerConfig" :z-index="zIndex" :opacity="1" />
</template>
