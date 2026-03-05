import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockLocale = ref('de')
const mockSwitchLocalePath = vi.fn((lang: string) => `/${lang}/map`)
const mockNavigateTo = vi.fn()

vi.stubGlobal('useI18n', () => ({ locale: mockLocale }))
vi.stubGlobal('useSwitchLocalePath', () => mockSwitchLocalePath)
vi.stubGlobal('navigateTo', mockNavigateTo)

import { useAppStore } from '~/stores/app'

describe('useAppStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        mockLocale.value = 'de'
        vi.clearAllMocks()
    })

    it('currentLocale reflects the i18n locale', () => {
        const store = useAppStore()
        expect(store.currentLocale).toBe('de')

        mockLocale.value = 'fr'
        expect(store.currentLocale).toBe('fr')
    })

    it('applyLocale navigates to the path returned by switchLocalePath', async () => {
        const store = useAppStore()
        await store.applyLocale('fr')

        expect(mockSwitchLocalePath).toHaveBeenCalledWith('fr')
        expect(mockNavigateTo).toHaveBeenCalledWith('/fr/map')
    })
})
