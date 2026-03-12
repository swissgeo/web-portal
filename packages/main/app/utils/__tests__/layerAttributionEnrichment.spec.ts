import {
    clearLayerAttributionCacheForTests,
    getAttributionForLayer,
    mergeLayerAttribution,
} from '~/utils/layerAttributionEnrichment'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('layerAttributionEnrichment', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
        fetchMock.mockReset()
        clearLayerAttributionCacheForTests()
        vi.stubGlobal('$fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('requests layers config with language and returns matching attribution metadata', async () => {
        fetchMock.mockResolvedValue({
            'ch.layer.one': {
                attribution: 'French source',
                attributionUrl: 'https://example.test/source',
            },
        })

        const attribution = await getAttributionForLayer(
            'ch.layer.one',
            'fr',
            'https://example.test/layers-config'
        )

        expect(fetchMock).toHaveBeenCalledWith('https://example.test/layers-config?lang=fr')
        expect(attribution).toEqual({
            title: 'French source',
            url: 'https://example.test/source',
        })
    })

    it('returns null when no matching layer entry exists', async () => {
        fetchMock.mockResolvedValue({
            'ch.layer.other': {
                attribution: 'Other source',
            },
        })

        const attribution = await getAttributionForLayer(
            'ch.layer.missing',
            'en',
            'https://example.test/layers-config'
        )

        expect(attribution).toBeNull()
    })

    it('falls back safely to null when layers config fetch fails', async () => {
        fetchMock.mockRejectedValue(new Error('network down'))

        const attribution = await getAttributionForLayer(
            'ch.layer.one',
            'de',
            'https://example.test/layers-config'
        )

        expect(attribution).toBeNull()
    })

    it('does not clear existing attribution title when remote title is missing', () => {
        const merged = mergeLayerAttribution(
            { title: 'OGC source' },
            {
                url: 'https://example.test/new-url',
            }
        )

        expect(merged).toEqual({
            title: 'OGC source',
            url: 'https://example.test/new-url',
        })
    })
})
