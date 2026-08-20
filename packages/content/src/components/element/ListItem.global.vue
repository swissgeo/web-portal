<script setup lang="ts">
import type { ListItem } from "@content/types";

import RichText from "@content/components/RichText.vue";
import { parseRichText } from "@content/utils/richText";
import { computed, useSlots } from "vue";

const { data } = defineProps<{ data: ListItem }>();
const slots = useSlots();
const nodes = computed(() => parseRichText(data.content?.text ?? ""));
</script>

<template>
  <ProseLi v-if="nodes.length || slots.default">
    <RichText :nodes="nodes" />
    <slot />
  </ProseLi>
</template>
