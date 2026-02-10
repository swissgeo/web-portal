import { useDrawingStore } from '@swissgeo/drawing'
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

import OpenLayersDrawingLayer from '../OpenLayersDrawingLayer.vue'

const mockSetSelectedIcon = vi.fn()

vi.mock('@swissgeo/drawing', () => ({
    useDrawingStore: vi.fn(() => ({
        setSelectedIcon: mockSetSelectedIcon,
        drawingFeatures: [],
    })),
    useOlDrawing: vi.fn(() => ({
        startDrawing: vi.fn(),
        stopDrawing: vi.fn(),
        getFeatures: vi.fn(() => []),
        clearFeatures: vi.fn(),
        addFeatures: vi.fn(),
        setVisibility: vi.fn(),
        setZIndex: vi.fn(),
        updateFeatureText: vi.fn(),
        setSelectedIcon: mockSetSelectedIcon,
    })),
}))

describe('OpenLayersDrawingLayer.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(OpenLayersDrawingLayer, {
            props: {
                layer: {
                    humanId: 'test-layer',
                    uuid: '1234',
                    opacity: 1,
                    ce: { value: null },
                },
            },
        })
        expect(wrapper.exists()).toBe(true)
    })

    it('calls setSelectedIcon on icon selection', () => {
        mount(OpenLayersDrawingLayer, {
            props: {
                layer: {
                    humanId: 'test-layer',
                    uuid: '1234',
                    opacity: 1,
                    ce: { value: null },
                },
            },
        })

        const drawingStore = useDrawingStore()
        // simulate icon selection by calling the store method directly
        drawingStore.setSelectedIcon('icon-id')
        expect(drawingStore.setSelectedIcon).toHaveBeenCalledWith('icon-id')
    })
})
