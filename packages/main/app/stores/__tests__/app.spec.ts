import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { locale } = await vi.hoisted(async () => {
    const { ref } = await import('vue')
    return { locale: ref('de') }
})

const { useSwitchLocalePath, mockNavigateTo } = vi.hoisted(() => {
    return {
        useSwitchLocalePath: vi.fn((lang: string) => `/${lang}/map`),
        mockNavigateTo: vi.fn(),
    }
})

mockNuxtImport('useSwitchLocalePath', () => () => useSwitchLocalePath)
mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useI18n', () => () => ({
    t: vi.fn((key: string) => key),
    locale,
}))

import { useAppStore } from '~/stores/app'

describe('useAppStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        locale.value = 'de'
        vi.clearAllMocks()
    })

    it('locale reflects the i18n locale', () => {
        const store = useAppStore()
        expect(store.locale).toBe('de')

        locale.value = 'fr'
        expect(store.locale).toBe('fr')
    })

    it('applyLocale navigates to the path returned by switchLocalePath', async () => {
        const store = useAppStore()
        await store.applyLocale('fr')

        expect(useSwitchLocalePath).toHaveBeenCalledWith('fr')
        expect(mockNavigateTo).toHaveBeenCalledWith('/fr/map')
    })
})
