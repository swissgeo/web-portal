<script lang="ts" setup>
import { computed } from "vue";

import type { LeadContentPageWithCheckbox } from "@/types";

const { data } = defineProps<{
  data: Record<string, LeadContentPageWithCheckbox>;
}>();

const containers = computed(() => {
  if (!data.containers) {
    return [];
  }
  return data.containers?.containers?.section
    ? [data.containers.containers.section]
    : [];
});
</script>

<template>
  <section class="mb-4">
    <ContentRenderer :containers="containers" />
  </section>
</template>
