<script setup lang="ts">
import * as lucideIcons from 'lucide-vue-next'
import { computed } from 'vue'

const { name } = defineProps<{
    name: string
}>()

const component = computed(() => (lucideIcons as Record<string, object>)[name])
</script>

<template>
    <component
        :is="component"
        class="shrink-0 grow-0"
    ></component>
</template>
