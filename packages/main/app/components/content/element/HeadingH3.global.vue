<script lang="ts" setup>
import type { TitleComponent } from '@swissgeo/shared/livingdocs'

const { data } = defineProps<{ data: TitleComponent }>()
</script>

<template>
    <h3>{{ data.content.title || '' }}</h3>
</template>
