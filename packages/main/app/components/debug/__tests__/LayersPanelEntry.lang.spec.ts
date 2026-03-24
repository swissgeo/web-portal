import type { Dataset } from '@swissgeo/ogc'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { mount } from '@vue/test-utils'
import LayersPanelEntry from '~/components/debug/LayersPanelEntry.vue'
import { describe, expect, it, vi } from 'vitest'

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

mockNuxtImport('useI18n', () => {
    return () => ({
        t: vi.fn((key: string) => key),
    })
})

describe('LayersPanelEntry.vue locale-aware behavior', () => {
    it('adds layer with locale-derived dataset language', async () => {
        const dataset: Dataset = {
            id: 'ch.test.layer',
            links: [
                {
                    rel: 'distributions',
                    href: 'https://example.test/distributions',
                    title: 'd:wms',
                },
            ],
            properties: {
                title: 'Layer title',
                type: 'Dataset',
                preferredDistributionId: 'd:wms',
            },
        }

        const wrapper = mount(LayersPanelEntry, {
            props: { dataset },
        })

        await wrapper.find('button').trigger('click')

        expect(makeServerLayerSpy).toHaveBeenCalled()
        expect(addLayerSpy).toHaveBeenCalled()
    })
})
