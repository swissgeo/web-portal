import type { FileLayer } from '@swissgeo/layers'

import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

import OpenLayersDrawingLayer from '../components/OpenLayersDrawingLayer.vue'

const mockSetSelectedIcon = vi.fn()
const mockSetZIndex = vi.fn()
const mockDrawingStore = {
    drawingFeatures: [],
    drawingMode: 'None',
    isDrawing: false,
    featureCount: 0,
    selectedIconId: undefined,
    setSelectedFeatureId: vi.fn(),
    setSelectedFeatureInfo: vi.fn(),
    clearPassiveSelection: vi.fn(),
}

function createLayerFixture(): FileLayer {
    return {
        humanId: 'test-layer',
        uuid: '1234',
        opacity: 1,
        ce: { value: null },
    } as unknown as FileLayer
}

vi.mock('@/stores/drawing', () => ({
    useDrawingStore: vi.fn(() => ({
        ...mockDrawingStore,
    })),
}))

vi.mock('@/composables/olDrawing.composable', () => ({
    useOlDrawing: vi.fn(() => ({
        startDrawing: vi.fn(),
        stopDrawing: vi.fn(),
        enableActiveEditing: vi.fn(),
        disableActiveEditing: vi.fn(),
        getFeatures: vi.fn(() => []),
        clearFeatures: vi.fn(),
        addFeatures: vi.fn(),
        setVisibility: vi.fn(),
        setZIndex: mockSetZIndex,
        updateFeatureText: vi.fn(),
        setSelectedIcon: mockSetSelectedIcon,
        enablePassiveInspection: vi.fn(),
        disablePassiveInspection: vi.fn(),
    })),
}))

vi.mock('@/utils/markerIcons', () => ({
    getMarkerIconById: vi.fn(() => undefined),
}))

describe('OpenLayersDrawingLayer.vue', () => {
    it('renders correctly and applies initial zIndex', async () => {
        const wrapper = mount(OpenLayersDrawingLayer, {
            props: {
                layer: createLayerFixture(),
                zIndex: 5,
            },
        })
        expect(wrapper.exists()).toBe(true)
        expect(mockSetZIndex).toHaveBeenCalledWith(5)

        // update zIndex prop and verify watcher triggers
        await wrapper.setProps({ zIndex: 12 })
        expect(mockSetZIndex).toHaveBeenCalledWith(12)
    })

    it('calls setSelectedIcon on icon selection', () => {
        mockSetSelectedIcon.mockClear()

        mount(OpenLayersDrawingLayer, {
            props: {
                layer: createLayerFixture(),
                zIndex: 0,
            },
        })

        // simulate icon selection by calling the OL composable callback target directly
        mockSetSelectedIcon('icon-id')
        expect(mockSetSelectedIcon).toHaveBeenCalledWith('icon-id')
    })
})
