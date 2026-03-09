import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

import useOlKMZLayer from '../../composables/olKMZLayer.composable'
import OpenLayersKMZLayer from '../OpenLayersKMZLayer.vue'

const initialize = vi.fn()
const setVisibility = vi.fn()
const setZIndex = vi.fn()

vi.mock('../../composables/olKMZLayer.composable', () => ({
    default: vi.fn(() => ({
        initialize,
        setVisibility,
        setZIndex,
    })),
}))

vi.mock('@/stores/position', () => ({
    default: vi.fn(() => ({
        projection: { epsg: 'EPSG:3857' },
    })),
}))

describe.skip('OpenLayersKMZLayer.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(OpenLayersKMZLayer, {
            props: {
                layer: {
                    type: 'KMZ',
                    layerId: 'test-layer',
                    uuid: '1234',
                    fileData: 'base64encodeddata',
                    opacity: 1,
                    isVisible: true,
                    zIndex: 0,
                },
            },
        })
        expect(wrapper.exists()).toBe(true)
    })

    it('calls initialize on mount', () => {
        mount(OpenLayersKMZLayer, {
            props: {
                layer: {
                    type: 'KMZ',
                    layerId: 'test-layer',
                    uuid: '1234',
                    fileData: 'base64encodeddata',
                    opacity: 1,
                    isVisible: true,
                    zIndex: 0,
                },
            },
        })
        // @ts-expect-error useOlKMZLayer not fully typed
        const { initialize } = useOlKMZLayer()
        expect(initialize).toHaveBeenCalled()
    })
})
