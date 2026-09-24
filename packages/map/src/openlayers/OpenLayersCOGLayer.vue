<script lang="ts" setup>
import type { Map } from "ol";
import type { ShallowRef } from "vue";

import { computed, inject } from "vue";

import type { COGLayer } from "@/types";

import useOlCOGLayer from "@/composables/olCOGLayer.composable";

const { layer } = defineProps<{
  layer: COGLayer;
}>();

const olMap = inject<ShallowRef<Map | undefined>>("olMap");

const layerRef = computed(() => layer);

useOlCOGLayer(layerRef, olMap);
</script>

<template>
  <slot />
</template>
