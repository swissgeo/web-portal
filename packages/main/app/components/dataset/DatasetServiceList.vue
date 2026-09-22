<script lang="ts" setup>
import type { Distribution } from "@swissgeo/ogc";

import DatasetService from "./DatasetService.vue";

defineProps<{
  distributions: Distribution[];
}>();
</script>

<template>
  <ul class="flex flex-col gap-space-m">
    <li v-for="distribution in distributions" :key="distribution.id">
      <DatasetService :distribution="distribution" />
    </li>
  </ul>
</template>
