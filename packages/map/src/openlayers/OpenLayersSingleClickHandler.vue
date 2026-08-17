<script setup lang="ts">
import { useMapClickEvent } from "@/composables/useMapClickEvent.composable";
import type { MapClickEvent } from "@/types";

const emit = defineEmits<{
  "map-click": [event: MapClickEvent];
}>();
useMapClickEvent((event) => emit("map-click", event));
</script>
<template></template>
