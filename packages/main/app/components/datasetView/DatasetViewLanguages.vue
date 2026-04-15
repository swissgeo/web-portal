<script lang="ts" setup>
import type { Language } from '@swissgeo/ogc'

const { locale } = useI18n()

defineProps<{
    languages: Language[]
}>()

function resolveLanguageName(lang: Language): string {
    try {
        const displayNames = new Intl.DisplayNames([locale.value], { type: 'language' })
        return displayNames.of(lang.code)?.replace(/^\w/, (c) => c.toUpperCase()) ?? lang.name
    } catch {
        return lang.name
    }
}
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
                {{ resolveLanguageName(lang) }}
            </UBadge>
        </li>
    </ul>
</template>
