import type { DatasetCollection } from '@swissgeo/ogc'

import { flushPromises, mount } from '@vue/test-utils'
import LayersPanel from '~/components/debug/LayersPanel.vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, ref } from 'vue'

vi.mock('@swissgeo/layers', () => ({
    useLayerStore: () => ({
        addLayer: vi.fn(),
    }),
    makeServerLayer: vi.fn(),
}))

vi.mock('@swissgeo/skeleton', () => ({
    IconButton: {
        template: '<button><slot /></button>',
    },
}))

const useFetchSpy = vi.fn()

describe('LayersPanel.vue locale-aware records loading', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        const records: DatasetCollection = {
            id: 'datasets',
            type: 'Collection',
            records: [],
            itemType: 'Dataset',
            title: 'Datasets',
        }

        useFetchSpy.mockResolvedValue({
            data: ref(records),
        })

        vi.stubGlobal('ref', ref)
        vi.stubGlobal('computed', computed)
        vi.stubGlobal('useRuntimeConfig', () => ({
            public: {
                ogcApiEndpoint: 'https://example.test/collections',
            },
        }))
        vi.stubGlobal('useI18n', () => ({
            locale: ref('fr'),
        }))
        vi.stubGlobal('useFetch', useFetchSpy)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.clearAllMocks()
    })

    it('requests records with lang from active locale', async () => {
        const TestHost = defineComponent({
            components: { LayersPanel },
            template: '<Suspense><LayersPanel /></Suspense>',
        })

        mount(TestHost, {
            global: {
                stubs: {
                    DebugLayersPanelEntry: true,
                },
            },
        })

        await flushPromises()

        expect(useFetchSpy).toHaveBeenCalledWith('https://example.test/collections', {
            query: {
                lang: 'fr',
            },
        })
    })
})
