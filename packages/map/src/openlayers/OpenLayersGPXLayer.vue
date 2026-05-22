<script lang="ts" setup>
import type { Map } from "ol";
import type { ShallowRef } from "vue";

import { computed, inject } from "vue";

import type { GPXLayer } from "@/types";

import useOlGPXLayer from "@/composables/olGPXLayer.composable";

const { layer } = defineProps<{
  layer: GPXLayer;
}>();

const olMap = inject<ShallowRef<Map | undefined>>("olMap");

const layerRef = computed(() => layer);

useOlGPXLayer(layerRef, olMap);
</script>

<template>
  <slot />
</template>
