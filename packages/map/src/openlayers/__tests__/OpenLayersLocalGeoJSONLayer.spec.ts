import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

import useOlLocalGeoJSONLayer from '@/composables/olLocalGeoJSONLayer.composable'
import OpenLayersLocalGeoJSONLayer from '@/openlayers/OpenLayersLocalGeoJSONLayer.vue'

const initialize = vi.fn()
const setVisibility = vi.fn()
const setZIndex = vi.fn()

vi.mock('../../composables/olLocalGeoJSONLayer.composable', () => ({
    default: vi.fn(() => ({
        initialize,
        setVisibility,
        setZIndex,
    })),
}))

vi.mock('ol/layer/Vector', () => ({
    default: vi.fn(() => ({
        setSource: vi.fn(),
    })),
}))

vi.mock('ol/source/Vector', () => ({
    default: vi.fn(() => ({
        addFeature: vi.fn(),
        clear: vi.fn(),
    })),
}))

vi.mock('@/stores/position', () => ({
    default: vi.fn(() => ({
        projection: { epsg: 'EPSG:2056' },
    })),
}))

describe('OpenLayersLocalGeoJSONLayer.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(OpenLayersLocalGeoJSONLayer, {
            props: {
                layer: {
                    humanId: 'test-layer',
                    uuid: '1234',
                    fileData: '{}',
                    opacity: 1,
                    isVisible: true,
                    // @ts-expect-error ce not defined in the type, but is used in the component
                    ce: { value: null },
                },
                zIndex: 0,
            },
        })
        expect(wrapper.exists()).toBe(true)
    })

    it('calls initialize on mount', () => {
        mount(OpenLayersLocalGeoJSONLayer, {
            props: {
                layer: {
                    humanId: 'test-layer',
                    uuid: '1234',
                    fileData: '{}',
                    opacity: 1,
                    isVisible: true,
                    // @ts-expect-error ce not defined in the type, but is used in the component
                    ce: { value: null },
                },
                zIndex: 0,
            },
        })
        // @ts-expect-error useOlLocalGeoJSONLayer not fully typed
        const { initialize } = useOlLocalGeoJSONLayer()
        expect(initialize).toHaveBeenCalled()
    })
})
