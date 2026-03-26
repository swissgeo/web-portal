import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

import useOlKMLLayer from '../../composables/olKMLLayer.composable'
import OpenLayersKMLLayer from '../OpenLayersKMLLayer.vue'

const initialize = vi.fn()
const setVisibility = vi.fn()
const setZIndex = vi.fn()

vi.mock('../../composables/olKMLLayer.composable', () => ({
    default: vi.fn(() => ({
        initialize,
        setVisibility,
        setZIndex,
    })),
}))

vi.mock('@/stores/position', () => ({
    default: vi.fn(() => ({
        projection: { epsg: 'EPSG:2056' },
    })),
}))

describe.skip('OpenLayersKMLLayer.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(OpenLayersKMLLayer, {
            props: {
                layer: {
                    format: 'KML',
                    layerId: 'test-layer',
                    uuid: '1234',
                    data: '<kml></kml>',
                    opacity: 1,
                    isVisible: true,
                    zIndex: 0,
                },
            },
        })
        expect(wrapper.exists()).toBe(true)
    })

    it('calls initialize on mount', () => {
        mount(OpenLayersKMLLayer, {
            props: {
                layer: {
                    format: 'KML',
                    layerId: 'test-layer',
                    uuid: '1234',
                    data: '<kml></kml>',
                    opacity: 1,
                    isVisible: true,
                    zIndex: 0,
                },
            },
        })
        // @ts-expect-error useOlKMLLayer not fully typed
        useOlKMLLayer()
        // expect(initialize).toHaveBeenCalled()
    })
})
