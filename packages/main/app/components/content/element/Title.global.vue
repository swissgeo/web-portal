<script lang="ts" setup>
import type { ContentItem } from "~~/shared/types/livingdocs/Page";

const { data } = defineProps<{ data: ContentItem }>();
</script>

<template>
  <div>
    <h1>{{ data.content.title }}</h1>
  </div>
</template>
