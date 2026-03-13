import type { DatasetCollection } from '@swissgeo/ogc'

import { useOgcDatasetCollectionStore } from '~/stores/ogcDatasetCollection'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

const mockUseRuntimeConfig = vi.fn(() => ({
    public: {
        ogcApiEndpoint: 'https://example.test/collections',
    },
}))

const mockFetch = vi.fn(
    (_url: string, options?: { query?: { language?: string } }): Promise<DatasetCollection> =>
        Promise.resolve({
            id: 'datasets',
            type: 'Collection',
            itemType: 'Dataset',
            title: `Datasets (${options?.query?.language ?? 'unknown'})`,
            records: [],
        })
)

vi.stubGlobal('useRuntimeConfig', mockUseRuntimeConfig)
vi.stubGlobal('$fetch', mockFetch)

describe('useOgcDatasetCollectionStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })

    it('keeps locale sync active when the locale ref instance changes', async () => {
        const store = useOgcDatasetCollectionStore()

        const firstLocaleRef = ref('de')
        store.startLocaleSync(firstLocaleRef)
        await store.initialize(firstLocaleRef.value)

        firstLocaleRef.value = 'fr'
        await nextTick()
        await Promise.resolve()

        const secondLocaleRef = ref('fr')
        store.startLocaleSync(secondLocaleRef)

        secondLocaleRef.value = 'it'
        await nextTick()
        await Promise.resolve()

        const fetchedLanguages = mockFetch.mock.calls.map(([, options]) => options?.query?.language)

        expect(fetchedLanguages).toEqual(['de', 'fr', 'it'])
        expect(store.initialized).toBe(true)
    })

    it('keeps locale sync active after caller scope disposal', async () => {
        const store = useOgcDatasetCollectionStore()
        const localeRef = ref('de')

        const callerScope = effectScope()
        callerScope.run(() => {
            store.startLocaleSync(localeRef)
        })

        await store.initialize(localeRef.value)
        callerScope.stop()

        localeRef.value = 'fr'
        await nextTick()
        await Promise.resolve()

        const fetchedLanguages = mockFetch.mock.calls.map(([, options]) => options?.query?.language)

        expect(fetchedLanguages).toEqual(['de', 'fr'])
    })

    it('keeps the newest language when older requests resolve later', async () => {
        const store = useOgcDatasetCollectionStore()

        let resolveGerman!: (_value: DatasetCollection) => void
        let resolveFrench!: (_value: DatasetCollection) => void

        mockFetch
            .mockImplementationOnce(
                () =>
                    new Promise<DatasetCollection>((resolve) => {
                        resolveGerman = resolve
                    })
            )
            .mockImplementationOnce(
                () =>
                    new Promise<DatasetCollection>((resolve) => {
                        resolveFrench = resolve
                    })
            )

        const germanRequest = store.fetchForLanguage('de', { force: true })
        const frenchRequest = store.fetchForLanguage('fr', { force: true })

        resolveFrench({
            id: 'datasets',
            type: 'Collection',
            itemType: 'Dataset',
            title: 'Datasets (fr)',
            records: [],
        })
        await frenchRequest

        resolveGerman({
            id: 'datasets',
            type: 'Collection',
            itemType: 'Dataset',
            title: 'Datasets (de)',
            records: [],
        })
        await germanRequest

        expect(store.data?.title).toBe('Datasets (fr)')
    })
})
