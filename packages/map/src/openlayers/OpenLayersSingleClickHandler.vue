<script setup lang="ts">
import type { MapClickEvent } from "@/types";

import { useMapClickEvent } from "@/composables/useMapClickEvent.composable";

const emit = defineEmits<{
  "map-click": [event: MapClickEvent];
}>();
useMapClickEvent((event) => emit("map-click", event));
</script>
<template>
  <div />
</template>
