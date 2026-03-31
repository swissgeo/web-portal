import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockLocale, mockCookieRef, mockUseCookie } = vi.hoisted(() => {
    const mockLocale = { value: 'de' }
    const mockCookieRef = { value: null as string | null }
    const mockUseCookie = vi.fn(() => mockCookieRef)
    return { mockLocale, mockCookieRef, mockUseCookie }
})

mockNuxtImport('useI18n', () => () => ({ locale: mockLocale }))
mockNuxtImport('useCookie', () => mockUseCookie)

import persistLocale from '~/middleware/persist-locale'

type Middleware = () => void

describe('persist-locale middleware', () => {
    beforeEach(() => {
        mockLocale.value = 'de'
        mockCookieRef.value = null
        vi.clearAllMocks()
        mockUseCookie.mockReturnValue(mockCookieRef)
    })

    it('writes the current locale to the i18n_redirected cookie', () => {
        ;(persistLocale as Middleware)()
        expect(mockCookieRef.value).toBe('de')
    })

    it('writes fr when the locale is fr', () => {
        mockLocale.value = 'fr'
        ;(persistLocale as Middleware)()
        expect(mockCookieRef.value).toBe('fr')
    })

    it.each(['de', 'fr', 'en', 'it', 'rm'])('writes %s for every supported locale', (locale) => {
        mockLocale.value = locale
        ;(persistLocale as Middleware)()
        expect(mockCookieRef.value).toBe(locale)
    })

    it('reads the cookie with the key i18n_redirected', () => {
        ;(persistLocale as Middleware)()
        expect(mockUseCookie).toHaveBeenCalledWith('i18n_redirected')
    })
})
