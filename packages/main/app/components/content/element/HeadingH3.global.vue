<script lang="ts" setup>
import type { ContentItem } from "~~/shared/types/livingdocs/Page";

const { data } = defineProps<{
  data: ContentItem;
}>();
</script>

<template>
    <h3>{{ data.content.title }}</h3>
</template>
