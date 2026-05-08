import type { Extent } from 'ol/extent'

import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'

import { useMapStore } from '../stores/map'

export function useMap() {
    const mapStore = useMapStore()
    const { olMap, isMapLoaded } = storeToRefs(mapStore)
    const zoomLevel = ref<number>(0)
    const center = ref<[number, number]>([0, 0])
    const viewportExtent = ref<Extent>([0, 0, 0, 0])

    watch(
        () => olMap.value,
        (mapInstance) => {
            if (!mapInstance) {
                return
            }

            const view = mapInstance.getView()

            const updateCenter = () => {
                const newCenter = view.getCenter()
                if (newCenter && newCenter[0] !== undefined && newCenter[1] !== undefined) {
                    center.value = newCenter.slice(0, 2) as [number, number]
                }

                viewportExtent.value = view.calculateExtent(mapInstance.getSize())
            }

            // initial value
            zoomLevel.value = view.getZoom()
            updateCenter()

            // sync on change
            view.on('change:resolution', () => {
                zoomLevel.value = view.getZoom()
            })

            view.on('change:center', updateCenter)
            // During pan interactions this fires continuously while the pointer is moving.
            mapInstance.on('pointerdrag', updateCenter)
        },
        { immediate: true }
    )

    return {
        olMap,
        isMapLoaded,
        zoomLevel,
        center,
        viewportExtent,
    }
}
