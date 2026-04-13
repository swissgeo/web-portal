import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { ref } from 'vue'

import type { Dataset } from '@/types/Records'

import { useDistributionCollection, extractDistributionLink } from '../useDistributionCollection'
import ChBafuSchutzgebieteLuftfahrt from './fixtures/dataset_ch.bafu.schutzgebiete-luftfahrt.json'
import ChBafuSchutzgebieteLuftfahrtDistributions from './fixtures/distribution-collection_ch.bafu.schutzgebiete-luftfahrt.json'

describe('useDistributionCollection fetching the data distribution from the OGC records', () => {
    const handlers = [
        http.get(
            'https://services.dev.sgdi.tech/api/oar/v0/collections/ch.bafu.schutzgebiete-luftfahrt?language=en',
            () => {
                return HttpResponse.json(ChBafuSchutzgebieteLuftfahrtDistributions)
            }
        ),
    ]
    const server = setupServer(...handlers)

    beforeAll(() => server.listen())

    afterAll(() => server.close())

    afterEach(() => server.resetHandlers())

    it('extracts the distribution link correctly', () => {
        const distributionLink = extractDistributionLink(ChBafuSchutzgebieteLuftfahrt as Dataset)

        expect(distributionLink).toBe(
            'https://services.dev.sgdi.tech/api/oar/v0/collections/ch.bafu.schutzgebiete-luftfahrt?language=en'
        )
    })

    it('fetches the distribution correctly', async () => {
        const dataset = ref(ChBafuSchutzgebieteLuftfahrt as Dataset)

        const { distributionCollection } = useDistributionCollection(dataset)

        expect(distributionCollection.value).toBe(null)
        await flushPromises()
        expect(distributionCollection.value).toEqual(ChBafuSchutzgebieteLuftfahrtDistributions)
    })

    it('fetches the distribution correctly after the dataset becomes available', async () => {
        const dataset = ref<Dataset | null>(null)

        const { distributionCollection, distributionUrl } = useDistributionCollection(dataset)

        expect(distributionUrl.value).toBe(null)

        dataset.value = ChBafuSchutzgebieteLuftfahrt as Dataset

        await flushPromises()
        expect(distributionCollection.value).toEqual(ChBafuSchutzgebieteLuftfahrtDistributions)
    })

    it("doesn't trip with an invalid dataset", () => {
        const dataset = ref<Dataset | null>({
            id: 'some-dataset',
            links: [],
        } as unknown as Dataset)

        const { distributionCollection, distributionUrl } = useDistributionCollection(dataset)

        expect(distributionUrl.value).toBe(null)
        expect(distributionCollection.value).toBe(null)
    })

    it("doesn't trip with an unreachable URL", async () => {
        const dataset = ref<Dataset | null>({
            id: 'some-dataset',
            links: [
                {
                    href: 'http://services.dev.sgdi.tech/api/oar',
                    rel: 'distributions',
                    title: 'Distributions',
                },
            ],
        } as unknown as Dataset)

        const { distributionCollection, distributionUrl } = useDistributionCollection(dataset)
        await flushPromises()
        expect(distributionUrl.value).toEqual('http://services.dev.sgdi.tech/api/oar')
        expect(distributionCollection.value).toBe(null)
    })
})

describe('useDistributionCollection 404', () => {
    const handlers = [
        http.get(
            'https://services.dev.sgdi.tech/api/oar/v0/collections/ch.bafu.schutzgebiete-luftfahrt?language=en',
            () => {
                return HttpResponse.json('Not Found', { status: 404 })
            }
        ),
    ]
    const server = setupServer(...handlers)
    beforeAll(() => {
        server.listen()
    })

    it("doesn't trip with 404", async () => {
        const dataset = ref(ChBafuSchutzgebieteLuftfahrt as Dataset)

        const { distributionCollection } = useDistributionCollection(dataset)

        expect(distributionCollection.value).toBe(null)
        await flushPromises()
        expect(distributionCollection.value).toEqual(null)
    })
})

describe('useDistributionCollection 5xx', () => {
    const handlers = [
        http.get(
            'https://services.dev.sgdi.tech/api/oar/v0/collections/ch.bafu.schutzgebiete-luftfahrt?language=en',
            () => {
                return HttpResponse.error()
            }
        ),
    ]
    const server = setupServer(...handlers)
    beforeAll(() => {
        server.listen()
    })

    it("doesn't trip with 5xx", async () => {
        const dataset = ref(ChBafuSchutzgebieteLuftfahrt as Dataset)

        const { distributionCollection } = useDistributionCollection(dataset)

        expect(distributionCollection.value).toBe(null)
        await flushPromises()
        expect(distributionCollection.value).toEqual(null)
    })
})

describe('extractDistributionLink', () => {
    it.each(['Distributions', 'distributions', 'dIstrIbUtions', 'DISTRIBUTIONS'])(
        'works with random case distribution rels (%s)',
        (rel) => {
            const dataset = {
                links: [
                    {
                        rel,
                        href: 'my-link',
                        title: 'Distros',
                    },
                ],
            }
            const link = extractDistributionLink(dataset)
            expect(link).toEqual('my-link')
        }
    )
})
