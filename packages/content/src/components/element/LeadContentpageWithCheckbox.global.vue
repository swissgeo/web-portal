<script setup lang="ts">
import type { LeadContentPageWithCheckbox } from "@content/types";

import { computed } from "vue";

/* Passing data through */
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
