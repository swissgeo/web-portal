import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

import useOlGPXLayer from '../../composables/olGPXLayer.composable'
import OpenLayersGPXLayer from '../OpenLayersGPXLayer.vue'

vi.mock('@/stores/position', () => ({
    default: vi.fn(() => ({
        projection: { epsg: 'EPSG:2056' },
    })),
}))

const initialize = vi.fn()
const setVisibility = vi.fn()
const setZIndex = vi.fn()

vi.mock('../../composables/olGPXLayer.composable', () => ({
    default: vi.fn(() => ({
        initialize,
        setVisibility,
        setZIndex,
    })),
}))

describe('OpenLayersGPXLayer.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(OpenLayersGPXLayer, {
            props: {
                layer: {
                    humanId: 'test-layer',
                    uuid: '1234',
                    fileData: '<gpx></gpx>',
                    opacity: 1,
                    zIndex: 1,
                    isVisible: true,
                    // @ts-expect-error ce not defined in the type, but is used in the component
                    ce: { value: null },
                },
            },
        })
        expect(wrapper.exists()).toBe(true)
    })

    it('calls initialize on mount', () => {
        mount(OpenLayersGPXLayer, {
            props: {
                layer: {
                    humanId: 'test-layer',
                    uuid: '1234',
                    fileData: '<gpx></gpx>',
                    opacity: 1,
                    zIndex: 1,
                    isVisible: true,
                    // @ts-expect-error ce not defined in the type, but is used in the component
                    ce: { value: null },
                },
            },
        })
        // @ts-expect-error useOlGPXLayer not fully typed
        const { initialize } = useOlGPXLayer()
        expect(initialize).toHaveBeenCalled()
    })
})
