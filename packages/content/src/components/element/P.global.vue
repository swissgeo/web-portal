<script lang="ts" setup>
import type { Paragraph } from "#types/index";

const { data } = defineProps<{ data: Paragraph }>();
</script>

<template>
  <ProseP class="mb-4">
    {{ data.content?.text }}
  </ProseP>
</template>
