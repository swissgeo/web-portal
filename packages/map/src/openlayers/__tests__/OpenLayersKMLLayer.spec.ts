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

describe('OpenLayersKMLLayer.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(OpenLayersKMLLayer, {
            props: {
                layer: {
                    humanId: 'test-layer',
                    uuid: '1234',
                    fileData: '<kml></kml>',
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
        mount(OpenLayersKMLLayer, {
            props: {
                layer: {
                    humanId: 'test-layer',
                    uuid: '1234',
                    fileData: '<kml></kml>',
                    opacity: 1,
                    zIndex: 1,
                    isVisible: true,
                    // @ts-expect-error ce not defined in the type, but is used in the component
                    ce: { value: null },
                },
            },
        })
        // @ts-expect-error useOlKMLLayer not fully typed
        const { initialize } = useOlKMLLayer()
        expect(initialize).toHaveBeenCalled()
    })
})
