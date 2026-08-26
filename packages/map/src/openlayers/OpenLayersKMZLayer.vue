<script lang="ts" setup>
import type { Map } from "ol";
import type { ShallowRef } from "vue";

import { computed, inject } from "vue";

import type { KMZLayer } from "@/types";

import useOlKMZLayer from "@/composables/olKMZLayer.composable";

const { layer } = defineProps<{
  layer: KMZLayer;
}>();

const emit = defineEmits<{
  error: [error: unknown];
}>();

const olMap = inject<ShallowRef<Map | undefined>>("olMap");

const layerRef = computed(() => layer);

useOlKMZLayer(layerRef, olMap, (error) => emit("error", error));
</script>

<template>
  <slot />
</template>
