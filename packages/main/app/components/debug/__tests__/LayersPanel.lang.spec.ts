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

const useOgcDatasetCollectionSpy = vi.fn()

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

        useOgcDatasetCollectionSpy.mockResolvedValue({
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
        vi.stubGlobal('useOgcDatasetCollection', useOgcDatasetCollectionSpy)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.clearAllMocks()
    })

    it('loads records from shared dataset collection composable', async () => {
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

        expect(useOgcDatasetCollectionSpy).toHaveBeenCalled()
    })
})
