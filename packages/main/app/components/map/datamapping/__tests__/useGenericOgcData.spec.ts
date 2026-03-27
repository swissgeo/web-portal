import type { DatasetLayer as DatasetLayerType } from '@swissgeo/layers'
import type { LayerFormat } from '@swissgeo/map'
import type {
    useDistributionCollection as useDistributionCollectionOriginal,
    useDistribution as useDistributionOriginal,
    usePreferredDistribution as usePreferredDistributionOriginal,
    useService as useServiceOriginal,
    Service,
    Distribution,
    DistributionCollection,
} from '@swissgeo/ogc'
import type { ShallowRef } from 'vue'

import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'

import { useGenericOgcData } from '../useGenericOgcData'

const layerMockData: Ref<DatasetLayerType> = ref({
    isVisible: true,
    isLoading: false,
    humanId: 'fancy-mc-layer',
    type: 'dataset',
    opacity: 1,
    uuid: 'some-fancy-uuid',
    data: {
        id: 'my-fancy-layer',
        links: [
            {
                rel: 'distributions',
                href: 'distribution-link',
            },
        ],
        properties: {
            preferredDistributionId: 'favourite-distribution',
            title: 'Fancy McLayer',
            type: 'Dataset',
        },
    },
})

// MOCKING all the parts that are called by the composable from the OGC package
// the values as well as the mocked composables are returned, so that we can
// test the behaviour of the changes
// we mock and return the data as well as the composables themselves. The data
// is returned so that we can change the behaviour for the tests
const {
    useDistributionCollectionMock,
    usePreferredDistributionMock,
    distributionMockData,
    useDistributionMock,
    useServiceMock,
    preferredDistributionIdMockData,
} = await vi.hoisted(async () => {
    const { ref } = await import('vue')

    const distributionMockData = ref({
        id: 'grossspuriges-heuchlerkraut:wmts',
        links: [
            {
                href: 'link-to-service',
                rel: 'service',
            },
        ],
        properties: {
            protocol: 'OGC:WMTS',
        },
    } as Distribution)

    //
    //  useDistributionCollection
    //
    const distributionUrlMockData = ref('')
    const distributionCollectionMockData = ref({
        records: [distributionMockData.value],
        id: 'grosspuriges-heuchlerkraut',
        itemType: 'record',
        type: 'Collection' as const,
        title: 'Grossspuriges Heuchlerkraut',
    })
    const useDistributionCollectionMock = vi.fn(
        (): ReturnType<typeof useDistributionCollectionOriginal> => ({
            distributionUrl: computed(() => distributionUrlMockData.value),
            distributionCollection: distributionCollectionMockData,
        })
    )

    //
    // usePreferredDistribution
    //
    const preferredDistributionIdMockData = ref('grossspuriges-heuchlerkraut:wmts')
    const usePreferredDistributionMock = vi.fn(
        (): ReturnType<typeof usePreferredDistributionOriginal> => ({
            preferredDistributionId: computed(() => preferredDistributionIdMockData.value),
        })
    )

    //
    //  useDistribution
    //
    const layerIdMockData = ref('my-fancy-layer')
    const useDistributionMock = vi.fn((): ReturnType<typeof useDistributionOriginal> => {
        return {
            distribution: computed(() => distributionMockData.value),
            layerId: computed(() => layerIdMockData.value),
        }
    })

    //
    //  useService
    //
    const serviceMockData = ref({
        linkTemplates: [
            {
                uriTemplate: 'uri is a canton in the heart of switzerland',
                rel: 'about',
            },
        ],
    } as Service)
    const serviceUrlMockData = ref('http://servizi.it')

    const useServiceMock = vi.fn(
        (): ReturnType<typeof useServiceOriginal> => ({
            serviceData: serviceMockData,
            serviceUrl: computed(() => serviceUrlMockData.value),
        })
    )

    return {
        distributionMockData,
        distributionUrlMockData,
        useDistributionCollectionMock,
        distributionCollectionMockData,

        preferredDistributionIdMockData,
        usePreferredDistributionMock,

        useDistributionMock,

        serviceMockData,
        serviceUrlMockData,
        useServiceMock,
    }
})

vi.mock('@swissgeo/ogc', () => ({
    usePreferredDistribution: usePreferredDistributionMock,
    useDistributionCollection: useDistributionCollectionMock,
    useDistribution: useDistributionMock,
    useService: useServiceMock,
}))

describe('useGenericOgcData ', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('calls the composables and returns data', async () => {
        const { distributionCollection, distribution, serviceData, layerFormat, layerId } =
            useGenericOgcData(layerMockData)

        await flushPromises()

        expect(useDistributionCollectionMock).toHaveBeenCalledTimes(1)
        expectTypeOf(distributionCollection).toEqualTypeOf<
            ShallowRef<DistributionCollection | null>
        >()
        expect(distributionCollection.value).toBeDefined()
        expect(distributionCollection.value).toHaveProperty('records', [distributionMockData.value])

        expect(useDistributionMock).toHaveBeenCalledTimes(1)
        expectTypeOf(distribution).toEqualTypeOf<ComputedRef<Distribution | null>>()
        expect(distribution.value).toBeDefined()

        expect(usePreferredDistributionMock).toHaveBeenCalledTimes(1)

        expect(useServiceMock).toHaveBeenCalledTimes(1)
        expectTypeOf(serviceData).toEqualTypeOf<ShallowRef<Service | null>>()
        expect(serviceData.value).toBeDefined()

        expectTypeOf(layerFormat).toEqualTypeOf<ComputedRef<LayerFormat | null>>()
        expect(layerFormat.value).toEqual('WMTS')

        expectTypeOf(layerId).toEqualTypeOf<ComputedRef<string | null>>()
        expect(layerId.value).toEqual('my-fancy-layer')
    })

    it('updates the distribution when preferredDistributionId changes', async () => {
        // this is a use case where we test if the reactivity cascades
        const { distribution } = useGenericOgcData(layerMockData)
        await flushPromises()

        expect(distribution.value).toHaveProperty('properties.protocol', 'OGC:WMTS')

        distributionMockData.value = {
            id: 'grossspuriges-heuchlerkraut:wms',
            links: [{ href: 'link-to-service', rel: 'service' }],
            properties: { protocol: 'OGC:WMS', title: 'wms', type: 'Distribution' },
        }
        preferredDistributionIdMockData.value = 'grossspuriges-heuchlerkraut:wms'
        await flushPromises()

        expect(distribution.value).toHaveProperty('properties.protocol', 'OGC:WMS')
    })
})
