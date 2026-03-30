import type { H3Event } from 'h3'

import { beforeEach, describe, expect, it, vi } from 'vitest'

// All route files now explicitly import from h3 — mock the module.
const mockSendRedirect = vi.hoisted(() => vi.fn())
const mockSetResponseStatus = vi.hoisted(() => vi.fn())
const mockDefineEventHandler = vi.hoisted(() => (handler: unknown) => handler)
const mockGetRouterParam = vi.hoisted(() =>
    vi.fn(
        (event: H3Event, name: string) =>
            (event as unknown as { context: { params: Record<string, string> } }).context?.params?.[
                name
            ]
    )
)

vi.mock('h3', () => ({
    defineEventHandler: mockDefineEventHandler,
    getRouterParam: mockGetRouterParam,
    sendRedirect: mockSendRedirect,
    setResponseStatus: mockSetResponseStatus,
}))

// resolveLocale is a Nitro server-util auto-import — stub it as a global.
const mockResolveLocale = vi.fn()
vi.stubGlobal('resolveLocale', mockResolveLocale)

import localeRoute from '../[locale]'
import indexRoute from '../index'
import mapRoute from '../map'

type Handler = (_event: H3Event) => unknown
const event = {} as H3Event

// ─── Entry-point routes (/ and /map) ────────────────────────────────────────

describe('/ and /map — locale-aware entry points', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it.each([
        ['/', indexRoute as Handler],
        ['/map', mapRoute as Handler],
    ])('%s redirects to /de/map when no locale cookie is set', (_, handler) => {
        mockResolveLocale.mockReturnValue('de')
        handler(event)
        expect(mockSendRedirect).toHaveBeenCalledWith(event, '/de/map', 302)
    })

    it.each([
        ['/', indexRoute as Handler],
        ['/map', mapRoute as Handler],
    ])('%s redirects to /fr/map when the fr cookie is set', (_, handler) => {
        mockResolveLocale.mockReturnValue('fr')
        handler(event)
        expect(mockSendRedirect).toHaveBeenCalledWith(event, '/fr/map', 302)
    })

    it.each([
        ['/', indexRoute as Handler],
        ['/map', mapRoute as Handler],
    ])('%s redirects to /it/map when the it cookie is set', (_, handler) => {
        mockResolveLocale.mockReturnValue('it')
        handler(event)
        expect(mockSendRedirect).toHaveBeenCalledWith(event, '/it/map', 302)
    })
})

// ─── CMS locale root routes ──────────────────────────────────────────────────

describe('CMS locale root routes — return 404 so the proxy can serve the CMS', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it.each(['de', 'fr', 'it', 'en', 'rm'])('/%s returns 404', (locale) => {
        const localeEvent = { context: { params: { locale } } } as unknown as H3Event
        ;(localeRoute as Handler)(localeEvent)
        expect(mockSetResponseStatus).toHaveBeenCalledWith(localeEvent, 404)
    })

    it('does not return 404 for non-locale paths', () => {
        const otherEvent = { context: { params: { locale: 'other' } } } as unknown as H3Event
        ;(localeRoute as Handler)(otherEvent)
        expect(mockSetResponseStatus).not.toHaveBeenCalled()
    })
})
