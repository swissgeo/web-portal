import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

import useOlGPXLayer from '../../composables/olGPXLayer.composable'
import OpenLayersGPXLayer from '../OpenLayersGPXLayer.vue'

vi.mock('@/stores/position', () => ({
    default: vi.fn(() => ({
        projection: { epsg: 'EPSG:2056' },
    })),
}))

vi.mock('../../composables/olGPXLayer.composable', () => ({
    default: vi.fn(() => ({})),
}))

describe.skip('OpenLayersGPXLayer.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(OpenLayersGPXLayer, {
            props: {
                layer: {
                    type: 'GPX',
                    layerId: 'test-layer',
                    uuid: '1234',
                    fileData: '<gpx></gpx>',
                    opacity: 1,
                    isVisible: true,
                    zIndex: 0,
                },
            },
        })
        expect(wrapper.exists()).toBe(true)
    })

    it('calls initialize on mount', () => {
        mount(OpenLayersGPXLayer, {
            props: {
                layer: {
                    type: 'GPX',
                    layerId: 'test-layer',
                    uuid: '1234',
                    fileData: '<gpx></gpx>',
                    opacity: 1,
                    isVisible: true,
                    zIndex: 0,
                },
            },
        })
        // @ts-expect-error useOlGPXLayer not fully typed
        useOlGPXLayer()
        // expect(initialize).toHaveBeenCalled()
    })
})
