<script lang="ts" setup>
import type { Section } from "@content/types";

import { computed } from "vue";

const { data } = defineProps<{ data: Section }>();

const containers = computed(() => {
  return data.containers?.section ?? [];
});
</script>

<template>
  <section class="mb-4">
    <ContentRenderer :containers="containers" />
  </section>
</template>
