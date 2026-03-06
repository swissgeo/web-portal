import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import type { DistributionCollection } from '@/types/Records'

import { useDistribution } from '../useDistribution'
import ChBafuSchutzgebieteLuftfahrtDistributions from './fixtures/distribution-collection_ch.bafu.schutzgebiete-luftfahrt.json'

describe('useDistribution composable returning the desired distribution', () => {
    it('extracts the desired distribution', () => {
        const distributionCollection = ref(
            ChBafuSchutzgebieteLuftfahrtDistributions as DistributionCollection
        )
        const distributionId = ref('ch.bafu.schutzgebiete-luftfahrt:wmts')
        const { distribution } = useDistribution(distributionCollection, distributionId)

        expect(distribution.value).toHaveProperty('properties')
        expect(distribution.value!.properties).toHaveProperty('protocol')
        expect(distribution.value!.properties.protocol).toEqual('OGC:WMTS')
        expect(distribution.value!.links!.length).toBeGreaterThan(0)

        distributionId.value = 'ch.bafu.schutzgebiete-luftfahrt:wms'

        expect(distribution.value).toHaveProperty('properties')
        expect(distribution.value!.properties).toHaveProperty('protocol')
        expect(distribution.value!.properties.protocol).toEqual('OGC:WMS')
        expect(distribution.value!.links!.length).toBeGreaterThan(0)
    })

    it('correctly extracts the layer id', () => {
        const distributionCollection = ref(
            ChBafuSchutzgebieteLuftfahrtDistributions as DistributionCollection
        )
        const distributionId = ref('ch.bafu.schutzgebiete-luftfahrt:wmts')
        const { layerId } = useDistribution(distributionCollection, distributionId)

        expect(layerId.value).to.equal('ch.bafu.schutzgebiete-luftfahrt')
    })

    it('tries to extract an invalid distribution', () => {
        const distributionCollection = ref(
            ChBafuSchutzgebieteLuftfahrtDistributions as DistributionCollection
        )
        const distributionId = ref('ch.bafu.schutzgebiete-luftfahrt-invalid')
        const { distribution } = useDistribution(distributionCollection, distributionId)

        expect(distribution.value).toBe(null)
    })

    it("still works even if the collection isn't ready at first but becomes available", () => {
        const distributionCollection = ref<DistributionCollection | null>(null)

        const distributionId = ref('ch.bafu.schutzgebiete-luftfahrt:wmts')
        const { distribution } = useDistribution(distributionCollection, distributionId)

        expect(distribution.value).toBe(null)

        distributionCollection.value =
            ChBafuSchutzgebieteLuftfahrtDistributions as DistributionCollection

        expect(distribution.value).toHaveProperty('properties')
        expect(distribution.value!.properties).toHaveProperty('protocol')
        expect(distribution.value!.properties.protocol).toEqual('OGC:WMTS')
        expect(distribution.value!.links!.length).toBeGreaterThan(0)
    })

    it('data is loaded even if the layerId is ready delayed', () => {
        const distributionCollection = ref(
            ChBafuSchutzgebieteLuftfahrtDistributions as DistributionCollection
        )

        const distributionId = ref<string | null>(null)
        const { distribution } = useDistribution(distributionCollection, distributionId)

        expect(distribution.value).toBe(null)
        distributionId.value = 'ch.bafu.schutzgebiete-luftfahrt:wmts'

        expect(distribution.value).toHaveProperty('properties')
        expect(distribution.value!.properties).toHaveProperty('protocol')
        expect(distribution.value!.properties.protocol).toEqual('OGC:WMTS')
        expect(distribution.value!.links!.length).toBeGreaterThan(0)
    })

    it("doesn't trip with incomplete distribution data", () => {
        const distributionCollection = ref({})

        const distributionId = ref<string | null>(null)
        // @ts-expect-error Intentionally giving it invalid data
        const { distribution } = useDistribution(distributionCollection, distributionId)

        expect(distribution.value).toBe(null)

        distributionCollection.value = {
            records: [
                {
                    links: [],
                },
            ],
        }
        expect(distribution.value).toBe(null)

        distributionCollection.value = {
            records: [
                {
                    links: [
                        {
                            id: 'something-garbage',
                        },
                    ],
                },
            ],
        }

        expect(distribution.value).toBe(null)
    })
})
