<script lang="ts" setup>
// TODO
// @ts-expect-error The usei18n here is typed with vue-i18n but it's actually nuxt-i18n
const { locale, locales, setLocale } = useI18n()

// local v-model for the UI component so we pass a simple string value
const selectedLocale = ref(locale.value)
// client-only guard
const isClient = ref(false)
onMounted(() => {
    isClient.value = true
})

// keep local state in sync when the global locale changes
watch(locale, (v) => {
    selectedLocale.value = v
})
// when the UI changes, update global locale
watch(selectedLocale, (v) => {
    if (v && v !== locale.value) {
        setLocale(v)
    }
})

function handleLocaleChange(newLocale: string) {
    selectedLocale.value = newLocale
}
</script>

<template>
    <div v-if="isClient">
        <ULocaleSelect
            v-model="selectedLocale"
            :locales="locales"
            :highlight="true"
            :highlight-on-hover="true"
            :arrow="false"
            size="md"
            variant="ghost"
            :trailing="false"
            aria-label="Language switcher"
            @update:model-value="handleLocaleChange"
            :ui="{
                content: '!w-auto min-w-[150px] !max-w-none',
                base: 'p-5 !shadow-none !ring-0',
                value: 'hidden',
                leadingAvatarSize: '8',
                trailingIcon: 'hidden',
            }"
        />
    </div>
</template>
