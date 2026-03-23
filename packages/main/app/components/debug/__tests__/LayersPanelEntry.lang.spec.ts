import type { Dataset } from '@swissgeo/ogc'

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

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        // @ts-expect-error It works and this is a test
        ...actual,
        useI18n: vi.fn(() => ({
            t: vi.fn((key: string) => key),
        })),
    }
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
