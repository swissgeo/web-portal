import type { Layer } from '@swissgeo/layers'

import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

import OpenLayersDrawingLayer from '../components/OpenLayersDrawingLayer.vue'

const { mockUseOlDrawing } = vi.hoisted(() => ({
    mockUseOlDrawing: vi.fn(() => ({
        showHoverHint: ref(false),
        hoverHintText: ref(''),
        hoverHintX: ref(0),
        hoverHintY: ref(0),
        selectedIcon: ref({ id: 'default' }),
    })),
}))

vi.mock('@/composables/olDrawing.composable', () => ({
    useOlDrawing: mockUseOlDrawing,
}))

vi.mock('vue-i18n', () => ({
    useI18n: vi.fn(() => ({
        t: vi.fn((key: string) => key),
    })),
}))

function createLayerFixture(): Layer {
    return {
        humanId: 'test-layer',
        uuid: '1234',
        opacity: 1,
        isVisible: true,
        isLoading: false,
        type: 'dataset',
    } as unknown as Layer
}

describe('OpenLayersDrawingLayer.vue', () => {
    beforeEach(() => {
        mockUseOlDrawing.mockClear()
    })

    it('renders and calls useOlDrawing with layer and zIndex refs', () => {
        const wrapper = mount(OpenLayersDrawingLayer, {
            props: {
                layer: createLayerFixture(),
                zIndex: 5,
            },
        })

        expect(wrapper.exists()).toBe(true)
        expect(mockUseOlDrawing).toHaveBeenCalledTimes(1)

        const args = mockUseOlDrawing.mock.calls[0] as unknown as [
            { value: Layer },
            { value: number },
        ]
        expect(args[0].value.humanId).toBe('test-layer')
        expect(args[1].value).toBe(5)
    })

    it('shows hover hint in document.body when showHoverHint is true', async () => {
        const showHoverHint = ref(false)
        const hoverHintText = ref('Click to select')
        const hoverHintX = ref(100)
        const hoverHintY = ref(200)

        mockUseOlDrawing.mockReturnValueOnce({
            showHoverHint,
            hoverHintText,
            hoverHintX,
            hoverHintY,
            selectedIcon: ref({ id: 'default' }),
        })

        // attachTo body so Teleport to="body" has a target
        mount(OpenLayersDrawingLayer, {
            props: {
                layer: createLayerFixture(),
                zIndex: 0,
            },
            attachTo: document.body,
        })

        expect(document.querySelector('.pointer-events-none')).toBeNull()

        showHoverHint.value = true
        await new Promise((r) => setTimeout(r, 0))

        const hint = document.querySelector('.pointer-events-none')
        expect(hint).not.toBeNull()
        expect(hint?.textContent?.trim()).toBe('Click to select')
    })

    it('passes the olMap inject to useOlDrawing', () => {
        const fakeMap = { addLayer: vi.fn(), removeLayer: vi.fn() }

        mount(OpenLayersDrawingLayer, {
            props: {
                layer: createLayerFixture(),
                zIndex: 3,
            },
            global: {
                provide: {
                    olMap: ref(fakeMap),
                },
            },
        })

        const callArgs = mockUseOlDrawing.mock.calls[0] as unknown as [
            unknown,
            unknown,
            { value: unknown },
        ]
        expect(callArgs[2]?.value).toStrictEqual(fakeMap)
    })
})
