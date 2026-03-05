import { useFetch } from '@vueuse/core'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import type { Dataset } from '@/types/Records'

import { useDistributionCollection, extractDistributionLink } from '../useDistributionCollection'
import ChBafuSchutzgebieteLuftfahrt from './fixtures/ch.bafu.schutzgebiete-luftfahrt.dataset.json'
import ChBafuSchutzgebieteLuftfahrtDistributions from './fixtures/ch.bafu.schutzgebiete-luftfahrt.distributions.json'

vi.mock('@vueuse/core', () => ({
    useFetch: vi.fn(),
}))

describe('useDistributionCollection', () => {
    it.skip('extracts the distribution link correctly', () => {
        const distributionLink = extractDistributionLink(ChBafuSchutzgebieteLuftfahrt as Dataset)

        expect(distributionLink).toBe(
            'https://services.dev.sgdi.tech/api/oar/v0/collections/ch.bafu.schutzgebiete-luftfahrt?language=en'
        )
    })

    it('fetches the distribution correctly', () => {
        vi.mocked(useFetch).mockReturnValue({
            get: () => ({
                // @ts-expect-error 2345
                json: () => {
                    const data = ref(ChBafuSchutzgebieteLuftfahrtDistributions)
                    const isFinished = ref(true)

                    return {
                        data,
                        isFinished,
                    }
                },
            }),
        })
        const dataset = ref(ChBafuSchutzgebieteLuftfahrt as Dataset)

        const { distributionCollection } = useDistributionCollection(dataset)
        expect(distributionCollection.value).toEqual(ChBafuSchutzgebieteLuftfahrtDistributions)
    })
})
