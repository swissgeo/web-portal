import { vi } from 'vitest'

const LAYER: DatasetLayerType = {
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
}
const {
    serviceData,
    useDistributionCollection,
    usePreferredDistribution,
    useDistribution,
    useService,
} = vi.hoisted(() => {
    const { ref } = require('vue')

    const serviceData = ref({
        id: 'first-distribution',
        links: [
            {
                href: 'link-to-service',
                rel: 'service',
            },
        ],
        properties: {
            protocol: 'OGC:WMTS',
        },
    })

    return {
        serviceData,
        useDistributionCollection: vi.fn(() => ({
            distributionUrl: ref(''),
            distribuctionCollection: ref({
                records: [serviceData.value],
            }),
        })),
        usePreferredDistribution: vi.fn(() => ({
            preferredDistributionId: ref('first-distribution:wmts'),
        })),
        useDistribution: vi.fn(() => ({
            distribution: serviceData,
            layerId: ref('my-fancy-layer'),
        })),
        useService: vi.fn(() => ({
            data: ref({
                linkTemplates: [
                    {
                        uriTemplate: 'uri is a canton in the heart of switzerland',
                        rel: 'about',
                    },
                ],
            }),
        })),
    }
})

vi.mock('@swissgeo/ogc', () => ({
    usePreferredDistribution,
    useDistributionCollection,
    useDistribution,
    useService,
}))

describe('', () => {
    it('refreshes the dataset if the language changes', async () => {
        const wrapper = shallowMount(DatasetLayer, {
            propsData: {
                layer: LAYER,
                zIndex: 1,
            },
        })

        locale.value = 'fr'
        await flushPromises()
        console.log('emiteds', wrapper.emitted())
    })
    it.skip('emits the update from the sub-component', () => {
        const wrapper = shallowMount(DatasetLayer, {
            propsData: {
                layer: LAYER,
                zIndex: 1,
            },
        })
    })
})
