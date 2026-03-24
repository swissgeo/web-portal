import type { DatasetLayer as DatasetLayerType } from '@swissgeo/layers'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises, mount, shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import DatasetLayer from '../DatasetLayer.vue'

mockNuxtImport('useI18n', () => {
    return () => ({
        t: vi.fn((key: string) => key),
        locale: ref('de'),
    })
})

const { distributionCollection, layerSpecificData, distribution, serviceData, layerType, layerId } =
    vi.hoisted(() => {
        // we need this for hoisting to work
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { ref } = require('vue')
        return {
            distributionCollection: ref(),
            layerSpecificData: ref(),
            distribution: ref(),
            serviceData: ref(),
            layerType: ref('WMTS'),
            layerId: ref(),
        }
    })

vi.mock('@/components/map/datamapping/useDatasetLayer', () => ({
    useDatasetLayer: vi.fn(() => ({
        distributionCollection,
        layerSpecificData,
        distribution,
        serviceData,
        layerType,
        layerId,
    })),
}))

describe('DatasetLayer Mapper/Converter Component for WMTS', () => {
    it('does not emit the basic data without travelling OGC', () => {
        const wrapper = shallowMount(DatasetLayer, {
            propsData: {
                layer: {
                    isVisible: true,
                    opacity: 1,
                    uuid: 'some-fancy-uuid',
                    // @ts-expect-error Intentionally breaking this here for this test
                    data: null,
                },
                zIndex: 1,
            },
        })

        // the component doesn't emit update if only these values are given
        expect(wrapper.emitted()).toEqual({})
    })

    it('renders the correct sub-converter depending on the deduced layer type', async () => {
        const wrapper = mount(DatasetLayer, {
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
        layerType.value = 'WMS'

        // see if it reactively reacts to the change in the data
        await flushPromises()
        expect(wrapper.text()).toEqual('WMS converter')
    })

    // TODO test the dataset refreshing on locale change
})
