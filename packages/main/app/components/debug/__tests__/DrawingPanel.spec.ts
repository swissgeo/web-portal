import type { ComponentPublicInstance } from 'vue'

import { useDrawingStore } from '@swissgeo/drawing'
import { mount } from '@vue/test-utils'
import DrawingPanel from '~/components/debug/DrawingPanel.vue'
import { describe, it, expect, vi } from 'vitest'

type DrawingPanelVm = ComponentPublicInstance & {
    handleClose: () => void
}

const setDrawingMode = vi.fn()
const setSelectedIconId = vi.fn()

vi.mock('@swissgeo/drawing', () => ({
    useDrawingStore: vi.fn(() => ({
        drawingMode: 'None',
        setDrawingMode,
        isDrawing: false,
        setSelectedIconId,
    })),
    useDrawingManager: vi.fn(() => ({
        startDrawing: vi.fn(),
        stopDrawing: vi.fn(),
        downloadKML: vi.fn(),
        downloadKMZ: vi.fn(),
        downloadGPX: vi.fn(),
        clearDrawing: vi.fn(),
    })),
}))

describe('DrawingPanel.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(DrawingPanel)
        expect(wrapper.exists()).toBe(true)
    })

    it('calls setDrawingMode when a drawing type is selected', async () => {
        const wrapper = mount(DrawingPanel)
        const drawingStore = useDrawingStore()

        // find the button that corresponds to Point drawing (contains "Point")
        const pointBtn = wrapper.findAll('button').find((b) => b.text().includes('Point'))
        expect(pointBtn).toBeTruthy()
        await pointBtn!.trigger('click')
        expect(drawingStore.setDrawingMode).toHaveBeenCalled()
    })

    it('calls stopDrawing and emits close on close', () => {
        const wrapper = mount(DrawingPanel)
        const drawingStore = useDrawingStore()

        // call handleClose directly (private function exposed on instance)
        ;(wrapper.vm as DrawingPanelVm).handleClose()
        expect(drawingStore.setDrawingMode).toHaveBeenCalledWith('None')
        expect(wrapper.emitted('close')).toBeTruthy()
    })
})
