<script setup lang="ts">
import type { Link } from "@content/types";

import { safeHref } from "@content/utils/richText";
import { computed } from "vue";

const { data } = defineProps<{ data: Link }>();
const href = computed(() => safeHref(data.content?.link?.href));
</script>

<template>
  <ProseA v-if="href && data.content?.text" :href="href">
    {{ data.content.text }}
  </ProseA>
</template>
