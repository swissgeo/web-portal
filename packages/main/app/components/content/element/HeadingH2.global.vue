<script lang="ts" setup>
import type { ContentItem } from "~~/shared/types/livingdocs/Page";

const { data } = defineProps<{
  data: ContentItem;
}>();
</script>

<template>
  <h2>{{ data.content.title }}</h2>
</template>
