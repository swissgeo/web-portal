<script lang="ts" setup>
import type { LeadContentPageWithCheckbox } from '~/types/livingdocs/Page'

const { data } = defineProps<{
    data: Record<string, LeadContentPageWithCheckbox>
}>()

const containers = computed(() => {
    if (!data.containers) {
        return []
    }
    return data.containers.section
})
</script>

<template>
    <section class="mb-4">
        <ContentRenderer :containers />
    </section>
</template>
