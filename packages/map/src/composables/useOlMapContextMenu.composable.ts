import type { Map as OlMap } from 'ol'
import type { Ref } from 'vue'

import { onLongPress } from '@vueuse/core'
import { inject, onUnmounted, ref, shallowRef, watch } from 'vue'

const LONG_PRESS_DELAY = 500

export function useOlMapContextMenu() {
    const olMap = inject<Ref<OlMap | undefined>>('olMap')

    const isVisible = ref(false)
    const coordinate = ref<[number, number] | null>(null)
    const viewportEl = shallowRef<HTMLElement | null>(null)

    let cleanup: (() => void) | null = null

    const openAtEvent = (evt: MouseEvent) => {
        const map = olMap?.value
        if (!map) {
            return
        }
        const px = map.getEventPixel(evt)
        const coord = map.getCoordinateFromPixel(px)
        isVisible.value = true
        coordinate.value = coord as [number, number]
    }

    const onContextMenu = (evt: MouseEvent) => {
        evt.preventDefault()
        openAtEvent(evt)
    }

    const close = () => {
        isVisible.value = false
    }

    watch(
        () => olMap?.value,
        (map) => {
            cleanup?.()
            viewportEl.value = null
            if (!map) {
                return
            }
            const viewport = map.getViewport()
            viewport.addEventListener('contextmenu', onContextMenu)
            viewportEl.value = viewport
            cleanup = () => viewport.removeEventListener('contextmenu', onContextMenu)
        },
        { immediate: true }
    )

    // Trigger the same popup on long press for touch/pen devices.
    // We guard manually against mouse input here.
    onLongPress(
        viewportEl,
        (evt) => {
            if (evt.pointerType !== 'mouse') {
                openAtEvent(evt)
            }
        },
        { delay: LONG_PRESS_DELAY }
    )

    onUnmounted(() => cleanup?.())

    return { isVisible, coordinate, close }
}
