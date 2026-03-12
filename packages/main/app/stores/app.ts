import type { Lang } from '@swissgeo/shared/language'

import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
    const { locale } = useI18n()
    const switchLocalePath = useSwitchLocalePath()

    // Use applyLocale to change the language — it navigates to the prefixed route,
    // which causes nuxt-i18n to update locale (URL is source of truth).
    // Read locale.value directly for serialization when needed.
    async function applyLocale(lang: Lang) {
        await navigateTo(switchLocalePath(lang))
    }

    return { locale, applyLocale }
})
