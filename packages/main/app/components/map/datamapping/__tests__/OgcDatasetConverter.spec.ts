import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import OgcDatasetConverter from '../OgcDatasetConverter.vue'

mockNuxtImport('useI18n', () => {
    return () => ({
        t: vi.fn((key: string) => key),
        locale: ref('de'),
    })
})

const {
    distributionCollection,
    layerSpecificData,
    distribution,
    serviceData,
    layerFormat,
    layerId,
} = await vi.hoisted(async () => {
    const { ref } = await import('vue')
    return {
        distributionCollection: ref(null),
        layerSpecificData: ref(),
        distribution: ref(null),
        serviceData: ref(null),
        layerFormat: ref('WMTS'),
        layerId: ref('layer-id'),
    }
})

vi.mock('@/components/map/datamapping/useGenericOgcData', () => ({
    useGenericOgcData: vi.fn(() => ({
        distributionCollection,
        layerSpecificData,
        distribution,
        serviceData,
        layerFormat,
        layerId,
    })),
}))

vi.mock('@/components/map/datamapping/useDatasetLocaleRefresh', () => ({
    default: vi.fn(() => ({})),
}))

describe('DatasetLayer Mapper/Converter Component for WMTS', () => {
    it('emits the basic data regardless of the OGC travelling', () => {
        const wrapper = mount(OgcDatasetConverter, {
            shallow: true,
            propsData: {
                layer: {
                    isVisible: true,
                    opacity: 0.42,
                    isLoading: false,
                    type: 'dataset',
                    humanId: 'human-id',
                    uuid: 'some-fancy-uuid',
                    // @ts-expect-error intentionally not giving a dataset
                    data: null,
                },
                zIndex: 1,
            },
        })

        expect(wrapper.emitted()).toHaveProperty('update')
        expect(wrapper.emitted('update')).toHaveLength(1)
        expect(wrapper.emitted('update')![0]).toEqual([
            {
                layerId: 'layer-id',
                opacity: 0.42,
                isVisible: true,
                uuid: 'some-fancy-uuid',
                format: 'WMTS',
                zIndex: 1,
                dimensions: null,
            },
        ])
    })

    it('emits the update if the data if the basic data is updated', async () => {
        const layerData = {
            isVisible: true,
            opacity: 0.42,
            isLoading: false,
            type: 'dataset' as const,
            humanId: 'human-id',
            uuid: 'some-fancy-uuid',
            data: null,
        } // layer data as from the layer store
        const wrapper = mount(OgcDatasetConverter, {
            shallow: true,
            propsData: {
                // @ts-expect-error intentionally not giving data
                layer: layerData,
                zIndex: 1,
            },
        })

        expect(wrapper.emitted()).toHaveProperty('update')
        expect(wrapper.emitted('update')).toHaveLength(1)
        // not testing initial state as that's covered by the test above

        // @ts-expect-error intentionally not giving a dataset
        await wrapper.setProps({ layer: { ...layerData, isVisible: false } })
        // we got an update!
        expect(wrapper.emitted('update')).toHaveLength(2)
        expect(wrapper.emitted('update')![1]).toEqual([
            {
                layerId: 'layer-id',
                opacity: 0.42,
                isVisible: false,
                uuid: 'some-fancy-uuid',
                format: 'WMTS',
                zIndex: 1,
                dimensions: null,
            },
        ])

        // @ts-expect-error intentionally not giving a dataset
        await wrapper.setProps({ layer: { ...layerData, opacity: 0.3 } })
        expect(wrapper.emitted('update')).toHaveLength(3)
        // no need to test the entire object again
        expect(wrapper.emitted('update')![2]![0]).toHaveProperty('opacity', 0.3)
    })

    it('renders the correct sub-converter depending on the deduced layer type', async () => {
        const wrapper = mount(OgcDatasetConverter, {
            propsData: {
                layer: {
                    isVisible: true,
                    opacity: 1,
                    isLoading: false,
                    type: 'dataset',
                    humanId: 'human-id',
                    uuid: 'some-fancy-uuid',
                    // @ts-expect-error intentionally not giving a dataset
                    data: null,
                },
                zIndex: 1,
            },
            global: {
                stubs: {
                    MapDatamappingWmtsLayer: {
                        template: '<div>WMTS converter</div>',
                    },
                    MapDatamappingWmsLayer: {
                        template: '<div>WMS converter</div>',
                    },
                },
            },
        })

        expect(wrapper.text()).toEqual('WMTS converter')

        // changing the protocol in the service
        layerFormat.value = 'WMS'

        // see if it reactively reacts to the change in the data
        await flushPromises()
        expect(wrapper.text()).toEqual('WMS converter')
    })

    it('emit update contains the layerSpecificData ', async () => {
        const wrapper = mount(OgcDatasetConverter, {
            shallow: true,
            propsData: {
                layer: {
                    isVisible: true,
                    opacity: 1,
                    isLoading: false,
                    type: 'dataset',
                    humanId: 'human-id',
                    uuid: 'some-fancy-uuid',
                    // @ts-expect-error intentionally not giving a dataset
                    data: null,
                },
                zIndex: 1,
            },
        })
        // @ts-expect-error Type-checker can't deduce that this method actually exists
        // but isn't really exposed
        wrapper.vm.pushLayerSpecificData({
            options: {
                url: 'http://swissgeo.ch',
            },
        })
        await flushPromises()
        expect(wrapper.emitted('update')).toHaveLength(2)
        expect(wrapper.emitted('update')!.pop()!.pop()).toHaveProperty('options', {
            url: 'http://swissgeo.ch',
        })
    })

    it('emits the remove if the converter gets unmounted', async () => {
        const wrapper = mount(OgcDatasetConverter, {
            shallow: true,
            propsData: {
                layer: {
                    isVisible: true,
                    opacity: 1,
                    isLoading: false,
                    type: 'dataset',
                    humanId: 'human-id',
                    uuid: 'some-fancy-uuid',
                    // @ts-expect-error intentionally not giving a dataset
                    data: null,
                },
                zIndex: 1,
            },
        })
        wrapper.unmount()
        await flushPromises()

        expect(wrapper.emitted()).toHaveProperty('remove')
    })
})
