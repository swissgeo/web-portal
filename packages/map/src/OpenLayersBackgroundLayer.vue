<script lang="ts" setup>
import { Layer } from "@swissgeo/layers";
const { layer } = defineProps<{ layer: Layer }>();

const zIndex = computed(() => 1);
</script>

<template>
  <OpenLayersWMTSLayer :layer="layer" :z-index="1" />
</template>
