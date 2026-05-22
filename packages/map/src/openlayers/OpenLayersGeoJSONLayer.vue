<script lang="ts" setup>
import type { Map } from "ol";
import type { Ref } from "vue";

import { computed, inject } from "vue";

import type { GeoJSONLayer } from "@/types";

// import * as geoJsonUtils from '@/utils/geoJsonUtils'
import useOlGeoJSONLayer from "../composables/olGeoJSONLayer.composable";

const { layer } = defineProps<{
  layer: GeoJSONLayer;
}>();

const layerRef = computed(() => layer);

const olMap = inject<Ref<Map | undefined>>("olMap");

useOlGeoJSONLayer(layerRef, olMap);
</script>

<template>
  <slot></slot>
</template>
