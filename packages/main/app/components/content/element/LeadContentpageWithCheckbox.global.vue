<script setup lang="ts">
/* Passing data through */
import type { LeadContentPageWithCheckbox } from "@swissgeo/shared/livingdocs";

const { data } = defineProps<{
  data: LeadContentPageWithCheckbox;
}>();

const containers = computed(() => {
  if (!data.containers) {
    return [];
  }
  return data.containers["lead-contentpage-with-checkbox"];
});
</script>

<template>
  <ContentRenderer :containers="containers" />
</template>
