import type { H3Event } from 'h3'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockParseCookies = vi.hoisted(() => vi.fn())

vi.mock('h3', () => ({
    parseCookies: mockParseCookies,
}))

import { resolveLocale } from '../resolveLocale'

const event = {} as H3Event

describe('resolveLocale', () => {
    beforeEach(() => {
        mockParseCookies.mockReset()
    })

    it('returns de when no cookie is present', () => {
        mockParseCookies.mockReturnValue({})
        expect(resolveLocale(event)).toBe('de')
    })

    it.each(['de', 'fr', 'en', 'it', 'rm'])('returns %s for a valid locale cookie', (locale) => {
        mockParseCookies.mockReturnValue({ i18n_redirected: locale })
        expect(resolveLocale(event)).toBe(locale)
    })

    it('falls back to de for an unrecognised locale in the cookie', () => {
        mockParseCookies.mockReturnValue({ i18n_redirected: 'xx' })
        expect(resolveLocale(event)).toBe('de')
    })

    it('falls back to de when the cookie value is an empty string', () => {
        mockParseCookies.mockReturnValue({ i18n_redirected: '' })
        expect(resolveLocale(event)).toBe('de')
    })
})
