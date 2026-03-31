<script lang="ts" setup>
import type { Lang } from '@swissgeo/shared/language'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import { computed, ref, watch } from 'vue'

const { locale, locales } = useI18n()
const appStore = useAppStore()

const localeItems = computed(() => {
    return locales.value.map((item) => ({
        code: item.code === 'en' ? 'en-GB' : item.code,
        name: item.name ?? item.code,
        dir: (item.dir ?? 'ltr') as 'ltr' | 'rtl',
        messages: {},
    }))
})

const selectedLocale = ref<Lang>(locale.value)

watch(locale, (value) => {
    selectedLocale.value = value
})

watch(selectedLocale, async (value) => {
    if (value && value !== locale.value) {
        try {
            const normalizedLocale = value?.split('-')[0] as Lang // 'en-GB' → 'en'
            await appStore.applyLocale(normalizedLocale)
        } catch (err) {
            log.error({
                title: 'SidebarLanguageSwitcherButton',
                titleColor: LogPreDefinedColor.Rose,
                messages: [
                    `Error while switching the language from ${locale.value} to ${value}`,
                    err,
                ],
            })
        }
    }
})
</script>

<template>
    <ClientOnly>
        <ULocaleSelect
            v-model="selectedLocale"
            :locales="localeItems"
            :highlight="true"
            :highlight-on-hover="true"
            :arrow="false"
            :avatar="{
                icon: 'i-lucide-globe',
            }"
            size="md"
            variant="ghost"
            :trailing="false"
            trailingIcon="i-lucide-globe"
            aria-label="Language switcher"
            :ui="{
                content: '!w-auto min-w-[150px] !max-w-none',
                base: 'p-5 !shadow-none !ring-0',
                value: 'hidden',
                leadingAvatarSize: '8',
                trailingIcon: 'hidden',
            }"
        />
    </ClientOnly>
</template>
