<script setup lang="ts">
import { computed } from "vue";

/* Passing data through */
import type { LeadContentPageWithCheckbox } from "@/types";

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
