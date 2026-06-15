<script lang="ts" setup>
import type { Map } from "ol";
import type { ShallowRef } from "vue";

import { computed, inject } from "vue";

import type { GeoJSONLayer } from "@/types";

import useOlLocalGeoJSONLayer from "../composables/olLocalGeoJSONLayer.composable";

const { layer } = defineProps<{
  layer: GeoJSONLayer;
}>();

const olMap = inject<ShallowRef<Map | undefined>>("olMap");

const layerRef = computed(() => layer);

useOlLocalGeoJSONLayer(layerRef, olMap);
</script>

<template>
  <slot />
</template>
