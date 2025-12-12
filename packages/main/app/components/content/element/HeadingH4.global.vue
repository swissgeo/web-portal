<script lang="ts" setup>
import type { ContentItem } from "~~/shared/types/livingdocs/Page";

const { data } = defineProps<{
  data: ContentItem;
}>();
</script>

<template>
    <h4>{{ data.content.title }}</h4>
</template>
