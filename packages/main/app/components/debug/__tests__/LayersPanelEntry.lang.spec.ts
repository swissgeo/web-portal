import type { Dataset, DistributionCollection } from '@swissgeo/ogc'

import { mount } from '@vue/test-utils'
import { useStorage } from '@vueuse/core'
import LayersPanelEntry from '~/components/debug/LayersPanelEntry.vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

const { addLayerSpy, makeServerLayerSpy } = vi.hoisted(() => ({
    addLayerSpy: vi.fn(),
    makeServerLayerSpy: vi.fn((type: string, dataset: Dataset) => ({ type, dataset })),
}))

vi.mock('@swissgeo/layers', () => ({
    useLayerStore: () => ({
        addLayer: addLayerSpy,
    }),
    makeServerLayer: makeServerLayerSpy,
}))

vi.mock('@swissgeo/log', () => ({
    default: {
        error: vi.fn(),
    },
    LogPreDefinedColor: {
        Rose: 'rose',
    },
}))

vi.mock('@vueuse/core', () => ({
    useStorage: vi.fn(),
}))

describe('LayersPanelEntry.vue locale-aware behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        const distributionData: DistributionCollection = {
            id: 'distribution-collection',
            type: 'Collection',
            records: [
                {
                    id: 'distribution-1',
                    properties: {
                        title: 'distribution',
                        type: 'Distribution',
                        protocol: 'OGC:WMS',
                    },
                },
            ],
            itemType: 'Distribution',
            title: 'Distributions',
        }

        vi.mocked(useStorage).mockReturnValue(
            ref({
                distributionData,
            })
        )

        vi.stubGlobal('ref', ref)
        vi.stubGlobal('computed', computed)
        vi.stubGlobal('onMounted', (callback: () => void) => callback())
        vi.stubGlobal('useI18n', () => ({
            locale: ref('fr'),
        }))
        vi.stubGlobal('$fetch', vi.fn())
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('builds locale-aware storage key', () => {
        const dataset: Dataset = {
            id: 'ch.test.layer',
            links: [
                { rel: 'distributions', href: 'https://example.test/distributions', title: 'd' },
            ],
            properties: {
                title: 'Layer title',
                type: 'Dataset',
            },
        }

        mount(LayersPanelEntry, {
            props: { dataset },
        })

        expect(useStorage).toHaveBeenCalledWith(
            'debug:layers-panel:distribution:ch.test.layer:fr',
            expect.any(Object)
        )
    })

    it('adds layer with locale-derived dataset language', async () => {
        const dataset: Dataset = {
            id: 'ch.test.layer',
            links: [
                { rel: 'distributions', href: 'https://example.test/distributions', title: 'd' },
            ],
            properties: {
                title: 'Layer title',
                type: 'Dataset',
            },
        }

        const wrapper = mount(LayersPanelEntry, {
            props: { dataset },
        })

        await wrapper.find('button').trigger('click')

        expect(makeServerLayerSpy).toHaveBeenCalled()
        expect(addLayerSpy).toHaveBeenCalled()

        const firstCall = makeServerLayerSpy.mock.calls[0]
        expect(firstCall).toBeDefined()
        if (!firstCall) {
            return
        }

        const [, localizedDataset] = firstCall
        expect(localizedDataset.properties.language?.code).toBe('fr')
    })
})
