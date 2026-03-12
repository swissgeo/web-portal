import type { Layer } from '@swissgeo/layers'

import { mount } from '@vue/test-utils'
import LayersPanelEntry from '~/components/debug/LayersPanelEntry.vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, onMounted } from 'vue'
import * as i18n from 'vue-i18n'

const { addLayerMock, makeServerLayerMock, getAttributionForLayerMock, mergeLayerAttributionMock } =
    vi.hoisted(() => ({
        addLayerMock: vi.fn(),
        makeServerLayerMock: vi.fn(),
        getAttributionForLayerMock: vi.fn(),
        mergeLayerAttributionMock: vi.fn(),
    }))

vi.mock('@swissgeo/layers', () => ({
    useLayerStore: () => ({
        addLayer: addLayerMock,
    }),
    makeServerLayer: makeServerLayerMock,
}))

vi.mock('@vueuse/core', () => ({
    useStorage: () => ({
        value: {
            distributionData: {
                id: 'distribution-id',
                records: [{ properties: { protocol: 'OGC:WMTS' } }],
            },
        },
    }),
}))

vi.mock('~/utils/layerAttributionEnrichment', () => ({
    getAttributionForLayer: getAttributionForLayerMock,
    mergeLayerAttribution: mergeLayerAttributionMock,
}))

describe('LayersPanelEntry.vue', () => {
    beforeEach(() => {
        addLayerMock.mockReset()
        makeServerLayerMock.mockReset()
        getAttributionForLayerMock.mockReset()
        mergeLayerAttributionMock.mockReset()
        ;(i18n as unknown as { __setI18nLocale: (_locale: string) => void }).__setI18nLocale('fr')

        vi.stubGlobal('useRuntimeConfig', () => ({
            public: {
                layersConfigEndpoint: 'https://example.test/layers-config',
            },
        }))
        vi.stubGlobal('computed', computed)
        vi.stubGlobal('onMounted', onMounted)

        makeServerLayerMock.mockImplementation((_type, dataset) => {
            return {
                humanId: dataset.id,
                info: {
                    displayName: dataset.id,
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

    it('uses locale-aware enrichment when adding a layer from the panel', async () => {
        const wrapper = mount(LayersPanelEntry, {
            props: {
                layer: {
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
                        title: 'Layer title',
                        attribution: 'OGC source',
                    },
                } as never,
            },
        })

        await wrapper.find('button').trigger('click')

        expect(getAttributionForLayerMock).toHaveBeenCalledWith(
            'ch.layer.one',
            'fr',
            'https://example.test/layers-config'
        )
        expect(mergeLayerAttributionMock).toHaveBeenCalled()
        expect(addLayerMock).toHaveBeenCalledWith(
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
})
