<script lang="ts" setup>
import type { Language } from '@swissgeo/ogc'

const { locale } = useI18n()

defineProps<{
    languages: Language[]
}>()

const displayNames = computed(() => {
    try {
        return new Intl.DisplayNames([locale.value], { type: 'language' })
    } catch {
        return null
    }
})

function resolveLanguageName(lang: Language): string {
    return displayNames.value?.of(lang.code)?.replace(/^\w/, (c) => c.toUpperCase()) ?? lang.name
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
