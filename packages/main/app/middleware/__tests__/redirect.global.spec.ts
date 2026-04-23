import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isLocaleRoot, isLocalized, redirector } from '../redirect.global'

const { navigateToMock } = vi.hoisted(() => {
    const navigateToMock = vi.fn()
    return { navigateToMock }
})

mockNuxtImport('useNuxtApp', () => () => ({
    $i18n: {
        localeCodes: { value: ['de', 'fr', 'it'] },
    },
    payload: {
        state: {
            _layout: 'abc',
        },
    },
}))

mockNuxtImport('useLocalePath', () => () => (path: string) => {
    // assuming that path has a leading /
    return `/de${path}`
})

mockNuxtImport('navigateTo', () => navigateToMock)

describe('redirect plugin', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it.each(['/map', '/dataset', '/map/something', '/dataset/uuid/', '/map?state=foo'])(
        'detects unlocalized path %s',
        (path) => {
            const result = isLocalized(path)
            expect(result).toBe(false)
        }
    )

    it.each([
        '/de/map',
        '/fr/dataset',
        '/it/map/something',
        '/de/dataset/uuid/',
        '/fr/map?state=foo',
    ])('detects localized path %s', (path) => {
        const result = isLocalized(path)
        expect(result).toBe(true)
    })

    it.each(['/de', '/fr', '/it'])('correctly detects locale root paths with %s', (path) => {
        const result = isLocaleRoot(path)
        expect(result).toBe(true)
    })

    it.each(['/su', '/en'])(
        'correctly detects if supposed locale root is actually none with %s',
        (path) => {
            const result = isLocaleRoot(path)
            expect(result).toBe(false)
        }
    )

    it.each([
        ['/', '/de/map'],
        ['/de', '/de/map'],
        ['/dataset', '/de/dataset'],
    ])('correctly tries to redirect from %s to %s', async (from, to) => {
        const fromObj = { path: from, query: {} }
        const toObj = { path: to, query: {} }
        await redirector(fromObj)
        expect(navigateToMock).toHaveBeenCalledExactlyOnceWith(toObj, { redirectCode: 301 })
    })

    it.each(['/de/map', '/de/dataset', '/health'])('does not redirect %s', async (from) => {
        const fromObj = { path: from, query: {} }
        await redirector(fromObj)
        expect(navigateToMock).toHaveBeenCalledTimes(0)
    })

    it('preserves the query param on redirect', async () => {
        const fromObj = {
            path: '/de',
            query: {
                param: '1',
            },
        }
        const toObj = { path: '/de/map', query: { param: '1' } }
        await redirector(fromObj)
        expect(navigateToMock).toHaveBeenCalledExactlyOnceWith(toObj, { redirectCode: 301 })
    })
})
