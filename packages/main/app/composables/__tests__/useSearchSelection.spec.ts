import type { Layer } from '@swissgeo/layers'
import type { Dataset } from '@swissgeo/ogc'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as i18n from 'vue-i18n'

import { useSearchSelection } from '../useSearchSelection'

const {
    layerStoreMock,
    searchStoreMock,
    makeServerLayerMock,
    getAttributionForLayerMock,
    mergeLayerAttributionMock,
} = vi.hoisted(() => ({
    layerStoreMock: {
        layers: [] as Array<{ humanId?: string }>,
        addLayer: vi.fn(),
    },
    searchStoreMock: {
        catalog: {
            records: [] as Dataset[],
        },
        loadCatalog: vi.fn(() => undefined),
    },
    makeServerLayerMock: vi.fn(),
    getAttributionForLayerMock: vi.fn(),
    mergeLayerAttributionMock: vi.fn(),
}))

vi.mock('@swissgeo/layers', () => ({
    useLayerStore: () => layerStoreMock,
    makeServerLayer: makeServerLayerMock,
}))

vi.mock('@swissgeo/skeleton', () => ({
    useSearchStore: () => searchStoreMock,
}))

vi.mock('@swissgeo/map', () => ({
    usePositionStore: () => ({
        setCenter: vi.fn(),
        setZoom: vi.fn(),
    }),
}))

vi.mock('@swissgeo/log', () => ({
    default: {
        error: vi.fn(),
        info: vi.fn(),
    },
    LogPreDefinedColor: {
        Red: 'red',
    },
}))

vi.mock('~/utils/layerAttributionEnrichment', () => ({
    getAttributionForLayer: getAttributionForLayerMock,
    mergeLayerAttribution: mergeLayerAttributionMock,
}))

describe('useSearchSelection', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
        ;(process as { client?: boolean }).client = true

        layerStoreMock.layers = []
        layerStoreMock.addLayer.mockReset()
        searchStoreMock.loadCatalog.mockClear()

        makeServerLayerMock.mockReset()
        getAttributionForLayerMock.mockReset()
        mergeLayerAttributionMock.mockReset()
        fetchMock.mockReset()
        ;(i18n as unknown as { __setI18nLocale: (_locale: string) => void }).__setI18nLocale('fr')

        vi.stubGlobal('useRuntimeConfig', () => ({
            public: {
                layersConfigEndpoint: 'https://example.test/layers-config',
            },
        }))
        vi.stubGlobal('$fetch', fetchMock)

        searchStoreMock.catalog.records = [
            {
                id: 'ch.layer.one',
                links: [
                    {
                        rel: 'distributions',
                        href: 'https://example.test/distributions',
                        title: 'distributions',
                    },
                ],
                properties: {
                    type: 'Dataset',
                    attribution: 'OGC source',
                },
            } as Dataset,
        ]

        fetchMock.mockResolvedValue({
            records: [{ properties: { protocol: 'OGC:WMTS' } }],
        })

        makeServerLayerMock.mockImplementation((_type, dataset) => {
            return {
                humanId: dataset.id,
                info: {
                    attribution: {
                        title: dataset.properties?.attribution,
                    },
                },
            } as Layer
        })

        getAttributionForLayerMock.mockResolvedValue({
            title: 'French source',
            url: 'https://example.test/source',
        })

        mergeLayerAttributionMock.mockReturnValue({
            title: 'French source',
            url: 'https://example.test/source',
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('enriches attribution with active locale in layer search add flow', async () => {
        const { handleResultSelection } = useSearchSelection()

        await handleResultSelection({
            resultType: 'LAYER',
            layerId: 'ch.layer.one',
        } as never)

        expect(getAttributionForLayerMock).toHaveBeenCalledWith(
            'ch.layer.one',
            'fr',
            'https://example.test/layers-config'
        )
        expect(layerStoreMock.addLayer).toHaveBeenCalledWith(
            expect.objectContaining({
                info: expect.objectContaining({
                    attribution: {
                        title: 'French source',
                        url: 'https://example.test/source',
                    },
                }),
            })
        )
    })

    it('keeps duplicate-layer skip behavior intact', async () => {
        layerStoreMock.layers = [{ humanId: 'ch.layer.one' }]

        const { handleResultSelection } = useSearchSelection()

        await handleResultSelection({
            resultType: 'LAYER',
            layerId: 'ch.layer.one',
        } as never)

        expect(getAttributionForLayerMock).not.toHaveBeenCalled()
        expect(layerStoreMock.addLayer).not.toHaveBeenCalled()
    })
})
