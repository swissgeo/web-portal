<script lang="ts" setup>
import type { Paragraph } from "@content/types";

const { data } = defineProps<{ data: Paragraph }>();
</script>

<template>
  <p class="mb-4">
    {{ data.content?.text }}
  </p>
</template>
