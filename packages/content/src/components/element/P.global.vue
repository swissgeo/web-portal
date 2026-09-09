<script lang="ts" setup>
import type { Paragraph } from "@/types";

const { data } = defineProps<{ data: Paragraph }>();
</script>

<template>
  <p class="type-paragraph mb-4">
    {{ data.content?.text }}
  </p>
</template>
