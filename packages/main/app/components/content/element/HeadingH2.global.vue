<script lang="ts" setup>
import type { TitleComponent } from '@swissgeo/shared/livingdocs'

const { data } = defineProps<{ data: TitleComponent }>()
</script>

<template>
    <h2>{{ data.content?.title || '' }}</h2>
</template>
