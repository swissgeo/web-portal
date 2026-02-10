<script lang="ts" setup>
import type { ContentItem } from '@swissgeo/shared/livingdocs'

const { data } = defineProps<{
    data: ContentItem
}>()
</script>

<template>
    <h4>{{ data.content.title }}</h4>
</template>
