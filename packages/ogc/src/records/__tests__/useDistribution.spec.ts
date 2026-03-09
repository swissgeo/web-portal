import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import type { ServiceProtocol, DistributionCollection } from '@/types/Records'

import { useDistribution } from '../useDistribution'
import ChBafuSchutzgebieteLuftfahrtDistributions from './fixtures/ch.bafu.schutzgebiete-luftfahrt.distributions.json'

describe('useDistribuction', () => {
    it.skip('extracts the desired distribution', () => {
        const distributionCollection = ref(
            ChBafuSchutzgebieteLuftfahrtDistributions as DistributionCollection
        )
        const protocol = ref<ServiceProtocol>('OGC:WMS')
        const { distribution } = useDistribution(distributionCollection, protocol)

        expect(distribution.value).toHaveProperty('properties')
        expect(distribution.value!.properties).toHaveProperty('protocol')
        expect(distribution.value!.properties.protocol).toEqual('OGC:WMS')
        expect(distribution.value!.links!.length).toBeGreaterThan(0)

        protocol.value = 'OGC:WMTS'

        expect(distribution.value).toHaveProperty('properties')
        expect(distribution.value!.properties).toHaveProperty('protocol')
        expect(distribution.value!.properties.protocol).toEqual('OGC:WMTS')
        expect(distribution.value!.links!.length).toBeGreaterThan(0)
    })
})
