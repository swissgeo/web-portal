<script lang="ts" setup>
import type { Map } from "ol";
import type { ShallowRef } from "vue";

import { computed, inject } from "vue";

import type { KMZLayer } from "@/types";

import useOlKMZLayer from "@/composables/olKMZLayer.composable";

const { layer } = defineProps<{
  layer: KMZLayer;
}>();

const olMap = inject<ShallowRef<Map | undefined>>("olMap");

const layerRef = computed(() => layer);

useOlKMZLayer(layerRef, olMap);
</script>

<template>
  <slot />
</template>
