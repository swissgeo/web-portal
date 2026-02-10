<script lang="ts" setup>
import type { ContentItem } from '@swissgeo/shared/livingdocs'

const { data } = defineProps<{
    data: ContentItem
}>()
</script>

<template>
    <h2>{{ data.content.title }}</h2>
</template>
