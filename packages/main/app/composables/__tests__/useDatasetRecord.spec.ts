import type { Dataset, DistributionCollection } from '@swissgeo/ogc'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DatasetRecord } from '../useDatasetRecord'

import { useDatasetRecord } from '../useDatasetRecord'

const { locale, asyncDataRef } = await vi.hoisted(async () => {
    const { ref } = await import('vue')
    return { locale: ref('de'), asyncDataRef: ref }
})

mockNuxtImport('useI18n', () => () => ({ locale }))

mockNuxtImport('useRuntimeConfig', () => () => ({
    public: { ogcApiEndpoint: 'https://api.example.com/collections/catalog' },
}))

const fetchMock = vi.fn()
vi.stubGlobal('$fetch', fetchMock)

// Mock useAsyncData: immediately call the handler and wrap the result in
// reactive refs, bypassing all Nuxt SSR/hydration machinery.
mockNuxtImport('useAsyncData', () => {
    return (_key: string | (() => string), handler: () => Promise<DatasetRecord>) => {
        const data = asyncDataRef<DatasetRecord | null>(null)
        const error = asyncDataRef<Error | null>(null)
        const status = asyncDataRef('pending')

        const promise = handler()
            .then((result) => {
                data.value = result
                status.value = 'success'
            })
            .catch((e) => {
                error.value = e
                status.value = 'error'
            })

        const result = { data, error, status }
        return Object.assign(result, {
            then: (resolve: (_v: typeof result) => void) => promise.then(() => resolve(result)),
        })
    }
})

const mockDataset: Dataset = {
    id: 'ch.swisstopo.test',
    properties: {
        type: 'Dataset',
        title: 'Test Dataset',
        description: 'A test dataset',
    },
    links: [
        {
            rel: 'self',
            href: 'https://api.example.com/collections/catalog/items/ch.swisstopo.test',
        },
        { rel: 'distributions', href: 'https://api.example.com/distributions' },
    ],
}

const mockDistributions: DistributionCollection = {
    id: 'distributions',
    type: 'Collection',
    itemType: 'distribution',
    title: 'Distributions',
    records: [
        {
            id: 'wms',
            properties: { type: 'Distribution', title: 'WMS' },
            links: [{ rel: 'enclosure', href: 'https://wms.example.com' }],
        },
    ],
}

describe('useDatasetRecord', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        locale.value = 'de'
    })

    it('fetches the dataset for the given id and locale', async () => {
        fetchMock.mockResolvedValueOnce(mockDataset).mockResolvedValueOnce(mockDistributions)

        const { dataset } = useDatasetRecord('ch.swisstopo.test')
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.example.com/collections/catalog/items/ch.swisstopo.test?language=de'
        )
        expect(dataset.value?.id).toBe('ch.swisstopo.test')
    })

    it('fetches distributions after the dataset using the distributions link', async () => {
        fetchMock.mockResolvedValueOnce(mockDataset).mockResolvedValueOnce(mockDistributions)

        const { distributionCollection } = useDatasetRecord('ch.swisstopo.test')
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/distributions?language=de')
        expect(distributionCollection.value?.records).toHaveLength(1)
    })

    it('overwrites existing language param in distributions URL without duplicating it', async () => {
        const datasetWithLangInDistLink: Dataset = {
            ...mockDataset,
            links: [
                { rel: 'distributions', href: 'https://api.example.com/distributions?language=en' },
            ],
        }
        fetchMock
            .mockResolvedValueOnce(datasetWithLangInDistLink)
            .mockResolvedValueOnce(mockDistributions)

        useDatasetRecord('ch.swisstopo.test')
        await flushPromises()

        expect(fetchMock).toHaveBeenLastCalledWith(
            'https://api.example.com/distributions?language=de'
        )
    })

    it('returns null distributionCollection when dataset has no distributions link', async () => {
        const datasetWithoutDistLink: Dataset = {
            ...mockDataset,
            links: [
                {
                    rel: 'self',
                    href: 'https://api.example.com/collections/catalog/items/ch.swisstopo.test',
                },
            ],
        }
        fetchMock.mockResolvedValueOnce(datasetWithoutDistLink)

        const { distributionCollection } = useDatasetRecord('ch.swisstopo.test')
        await flushPromises()

        expect(distributionCollection.value).toBeNull()
    })

    it('returns null dataset and does not fetch when id is null', async () => {
        const { dataset, distributionCollection } = useDatasetRecord(null)
        await flushPromises()

        expect(fetchMock).not.toHaveBeenCalled()
        expect(dataset.value).toBeNull()
        expect(distributionCollection.value).toBeNull()
    })

    it('reflects isLoading as false after fetch resolves', async () => {
        fetchMock.mockResolvedValueOnce(mockDataset).mockResolvedValueOnce(mockDistributions)

        const { isLoading } = useDatasetRecord('ch.swisstopo.test')
        await flushPromises()

        expect(isLoading.value).toBe(false)
    })

    it('populates error when the fetch fails', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Not found'))

        const { error } = useDatasetRecord('ch.swisstopo.test')
        await flushPromises()

        expect(error.value).toBeTruthy()
    })
})
