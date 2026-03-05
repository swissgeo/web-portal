import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useAppStore = defineStore('app', () => {
    const { locale } = useI18n()
    const switchLocalePath = useSwitchLocalePath()

    // currentLocale mirrors nuxt-i18n's locale (URL is source of truth).
    // Use applyLocale to change the language — it navigates to the prefixed route,
    // which causes nuxt-i18n to update locale, which updates this computed.
    const currentLocale = computed(() => locale.value)

    async function applyLocale(lang: string) {
        await navigateTo(switchLocalePath(lang))
    }

    return { currentLocale, applyLocale }
})
