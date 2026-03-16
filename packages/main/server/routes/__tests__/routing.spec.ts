import type { H3Event } from 'h3'

import { beforeEach, describe, expect, it, vi } from 'vitest'

// defineEventHandler and setResponseStatus are Nitro auto-import globals.
// Stub them before any imports so route modules evaluate correctly.
const mockSetResponseStatus = vi.hoisted(() => {
    const fn = vi.fn()
    ;(globalThis as Record<string, unknown>).defineEventHandler = (handler: unknown) => handler
    ;(globalThis as Record<string, unknown>).setResponseStatus = fn
    return fn
})

const mockSendRedirect = vi.hoisted(() => vi.fn())
vi.mock('h3', () => ({
    sendRedirect: mockSendRedirect,
}))

// resolveLocale is a Nitro server-util auto-import — stub it as a global.
const mockResolveLocale = vi.fn()
vi.stubGlobal('resolveLocale', mockResolveLocale)

import deRoute from '../de'
import enRoute from '../en'
import frRoute from '../fr'
import indexRoute from '../index'
import itRoute from '../it'
import mapRoute from '../map'
import rmRoute from '../rm'

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

    it.each([
        ['/de', deRoute as Handler],
        ['/fr', frRoute as Handler],
        ['/it', itRoute as Handler],
        ['/en', enRoute as Handler],
        ['/rm', rmRoute as Handler],
    ])('%s returns 404', (_, handler) => {
        handler(event)
        expect(mockSetResponseStatus).toHaveBeenCalledWith(event, 404)
    })
})
