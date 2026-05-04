import { storeToRefs } from 'pinia'
import { useMapStore } from '../stores/map'
import { ref, watch } from 'vue'


export function useMap() {
    const mapStore = useMapStore()
    const { olMap } = storeToRefs(mapStore)
    const zoomLevel = ref<number>(0)
    const center = ref<[number, number]>([0, 0])
    
    watch(
        () => olMap,
        (olMap) => {
            if (!olMap) return

            const view = olMap.value.getView()

            // initial value
            zoomLevel.value = view.getZoom()

            // sync on change
            view.on('change:resolution', () => {
                zoomLevel.value = view.getZoom()
            })

            view.on('change:center', () => {
                const newCenter = view.getCenter()
                if (newCenter && newCenter[0] !== undefined && newCenter[1] !== undefined) {
                    center.value = [newCenter[0], newCenter[1]]
                }
            })
        },
        { immediate: true }
    )

    return {
        olMap,
        zoomLevel,
        center,
    }
}