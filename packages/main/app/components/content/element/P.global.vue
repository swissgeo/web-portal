<script lang="ts" setup>
import type { Paragraph } from '@swissgeo/shared/livingdocs'

const { data } = defineProps<{ data: Paragraph }>()
</script>

<template>
    <p class="mb-4">
        {{ data.content?.text }}
    </p>
</template>
