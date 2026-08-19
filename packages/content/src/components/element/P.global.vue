<script lang="ts" setup>
import type { Paragraph } from "@content/types";

import { computed } from "vue";

const { data } = defineProps<{ data: Paragraph }>();

const text = computed(() => {
  return data.content?.text?.replaceAll("&nbsp;", "\u00a0") ?? "";
});
</script>

<template>
  <p class="mx-auto mb-4 max-w-[912px]">
    {{ text }}
  </p>
</template>
