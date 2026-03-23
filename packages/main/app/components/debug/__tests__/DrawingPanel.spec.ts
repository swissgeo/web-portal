import type { ComponentPublicInstance } from 'vue'

import { useDrawingStore } from '@swissgeo/drawing'
import { mount } from '@vue/test-utils'
import DrawingPanel from '~/components/debug/DrawingPanel.vue'
import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'

type DrawingPanelVm = ComponentPublicInstance & {
    handleClose: () => void
}

const messages = {
    en: {
        debug: {
            drawingClearConfirmTitle: 'Delete all drawings?',
            drawingClearConfirmDescription:
                'This action will remove all drawings from the current session.',
            drawingClearConfirmCancel: 'Cancel',
            drawingClearConfirmConfirm: 'Delete',
        },
    },
} as const

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        // @ts-expect-error It works and this is a test
        ...actual,
        useI18n: vi.fn(() => ({
            t: vi.fn((key: string) => key),
            messages,
        })),
    }
})

function mountDrawingPanel() {
    return mount(DrawingPanel, {})
}

const setDrawingMode = vi.fn()
const setSelectedIconId = vi.fn()
const setDrawingName = vi.fn()
const setDrawingEnabled = vi.fn()
const clearPassiveSelection = vi.fn()

vi.mock('@swissgeo/drawing', () => ({
    useDrawingStore: vi.fn(() => ({
        drawingMode: 'None',
        drawingName: 'My Drawings',
        setDrawingMode,
        setDrawingName,
        setDrawingEnabled,
        clearPassiveSelection,
        isDrawing: false,
        setSelectedIconId,
        selectedFeatureInfo: null,
        featureCount: 0,
        selectedIconId: 'default',
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
        const wrapper = mountDrawingPanel()
        expect(wrapper.exists()).toBe(true)
    })

    it('calls setDrawingMode when a drawing type is selected', async () => {
        const wrapper = mountDrawingPanel()
        const drawingStore = useDrawingStore()

        // find the button that corresponds to Point drawing (contains "Point")
        const pointBtn = wrapper.findAll('button').find((b) => b.text().includes('Point'))
        expect(pointBtn).toBeTruthy()
        await pointBtn!.trigger('click')
        expect(drawingStore.setDrawingMode).toHaveBeenCalled()
    })

    it('calls stopDrawing and emits close on close', () => {
        const wrapper = mountDrawingPanel()
        const drawingStore = useDrawingStore()

        // call handleClose directly (private function exposed on instance)
        ;(wrapper.vm as DrawingPanelVm).handleClose()
        expect(drawingStore.setDrawingMode).toHaveBeenCalledWith('None')
        expect(drawingStore.clearPassiveSelection).toHaveBeenCalled()
        expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('updates drawing name through the store', async () => {
        const wrapper = mountDrawingPanel()
        const drawingNameInput = wrapper.get('#drawing-name-input')

        await drawingNameInput.setValue('Route planning notes')

        expect(setDrawingName).toHaveBeenCalledWith('Route planning notes')
    })
})
