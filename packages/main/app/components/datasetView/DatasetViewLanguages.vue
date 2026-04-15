<script lang="ts" setup>
import type { Language } from '@swissgeo/ogc'

defineProps<{
    languages: Language[]
}>()
</script>

<template>
    <ul class="flex flex-wrap gap-2">
        <li
            v-for="lang in languages"
            :key="lang.code"
        >
            <UBadge
                color="neutral"
                variant="subtle"
            >
                {{ lang.alternate ?? lang.name }}
            </UBadge>
        </li>
    </ul>
</template>
