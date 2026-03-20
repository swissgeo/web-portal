import { flushPromises, shallowMount } from '@vue/test-utils'
import LayersPanel from '~/components/debug/LayersPanel.vue'
import { describe, expect, it, vi } from 'vitest'

const { useOgcCatalogSpy, locale } = vi.hoisted(() => ({
    useOgcCatalogSpy: vi.fn(() => ({
        data: [],
    })),
    locale: 'de',
}))

vi.mock('~/composables/useOgcCatalog', () => ({
    useOgcCatalog: useOgcCatalogSpy,
}))

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        // @ts-expect-error It works and this is a test
        ...actual,
        useI18n: vi.fn(() => ({
            t: vi.fn((key: string) => key),
            locale,
        })),
    }
})

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

describe('LayersPanel.vue locale-aware records loading', () => {
    it('loads records from shared dataset collection composable', async () => {
        shallowMount(LayersPanel, {
            global: {
                stubs: {
                    DebugLayersPanelEntry: true,
                },
            },
        })

        await flushPromises()

        expect(useOgcCatalogSpy).toHaveBeenCalled()
        expect(useOgcCatalogSpy).toHaveBeenCalledWith(locale)
    })
})
