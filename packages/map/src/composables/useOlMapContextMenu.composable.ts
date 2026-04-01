import type { Map as OlMap } from 'ol'
import type { Ref } from 'vue'

import { inject, onUnmounted, ref, watch } from 'vue'

export function useMapContextMenu() {
    const olMap = inject<Ref<OlMap | undefined>>('olMap')

    const isVisible = ref(false)
    const coordinate = ref<[number, number] | null>(null)
    const pixel = ref<[number, number] | null>(null)

    let cleanup: (() => void) | null = null

    const onContextMenu = (evt: MouseEvent) => {
        evt.preventDefault()
        const map = olMap?.value
        if (!map) {
            return
        }
        const px = map.getEventPixel(evt)
        const coord = map.getCoordinateFromPixel(px)
        isVisible.value = true
        coordinate.value = coord as [number, number]
        pixel.value = px as [number, number]
    }

    const close = () => {
        isVisible.value = false
    }

    watch(
        () => olMap?.value,
        (map) => {
            cleanup?.()
            if (!map) {
                return
            }
            map.getViewport().addEventListener('contextmenu', onContextMenu)
            cleanup = () => map.getViewport().removeEventListener('contextmenu', onContextMenu)
        },
        { immediate: true }
    )

    onUnmounted(() => cleanup?.())

    return { isVisible, coordinate, pixel, close }
}
