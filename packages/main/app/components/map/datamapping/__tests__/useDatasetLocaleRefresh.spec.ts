import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import useDatasetLocaleRefresh from '../useDatasetLocaleRefresh'

const { locale, newDataset } = await vi.hoisted(async () => {
    const { ref } = await import('vue')

    return {
        locale: ref('de'),
        newDataset: ref('new data'),
    }
})

mockNuxtImport('useI18n', () => {
    return () => ({
        locale,
    })
})

mockNuxtImport('useFetch', () => {
    return () => ({
        data: newDataset,
    })
})

describe('useDatasetRefresh', () => {
    it('updates the URL when the locale changes', async () => {
        const partialLayer = {
            uuid: 'uuid',
            humanId: 'keusches-nonnenkraut',
            data: {
                links: [
                    {
                        rel: 'self',
                        href: 'http://swissgeo.ch?language=de',
                    },
                ],
            },
        }

        const updateCallback = vi.fn()
        const updateInfoCallback = vi.fn()
        const { newUrlString } = useDatasetLocaleRefresh(
            partialLayer,
            updateCallback,
            updateInfoCallback
        )

        locale.value = 'fr'
        await flushPromises()
        expect(newUrlString.value).toEqual('http://swissgeo.ch/?language=fr')
    })

    it('updates the URL when the locale changes without previously having the query param', async () => {
        const partialLayer = {
            uuid: 'uuid',
            humanId: 'keusches-nonnenkraut',
            data: {
                links: [
                    {
                        rel: 'self',
                        href: 'http://swissgeo.ch',
                    },
                ],
            },
        }
        const updateCallback = vi.fn()
        const updateInfoCallback = vi.fn()
        const { newUrlString } = useDatasetLocaleRefresh(
            partialLayer,
            updateCallback,
            updateInfoCallback
        )
        locale.value = 'fr'
        await flushPromises()
        expect(newUrlString.value).toEqual('http://swissgeo.ch/?language=fr')
    })

    it('Triggers a refresh when the locale changes', async () => {
        const partialLayer = {
            uuid: 'uuid',
            humanId: 'keusches-nonnenkraut',
            data: {
                links: [
                    {
                        rel: 'self',
                        href: 'http://swissgeo.ch?language=de',
                    },
                ],
            },
        }

        const updateCallback = vi.fn()
        const updateInfoCallback = vi.fn()
        useDatasetLocaleRefresh(partialLayer, updateCallback, updateInfoCallback)

        locale.value = 'fr'
        // mocking the behaviour that a new dataset is returned from useFetch
        newDataset.value = 'dataset was reloaded'
        await flushPromises()
        expect(updateCallback).toHaveBeenCalled()
        expect(updateInfoCallback).toHaveBeenCalled()
    })
})
