<script lang="ts" setup>
export type Language = 'de' | 'fr' | 'en'
const { locale, locales, setLocale } = useI18n()

function handleLocaleChange(newLocale: string) {
    setLocale(newLocale)
}
</script>

<template>
    <ULocaleSelect :highlight="true" :model-value="locale" :locales="locales"
        @update:model-value="handleLocaleChange" />

</template>