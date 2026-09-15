<script lang="ts" setup>
import type { Paragraph } from "@content/types";

import { computed } from "vue";

const { data } = defineProps<{ data: Paragraph }>();

const text = computed(() => {
  return data.content?.text?.replaceAll("&nbsp;", "\u00a0") ?? "";
});
</script>

<template>
  <ProseP v-if="text" class="mb-4 max-w-[912px]">
    {{ text }}
  </ProseP>
</template>
