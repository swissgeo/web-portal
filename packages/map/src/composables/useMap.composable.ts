import { storeToRefs } from 'pinia'
import { useMapStore } from '../stores/map'
import { ref, watch } from 'vue'


export function useMap() {
    const mapStore = useMapStore()
    const { olMap } = storeToRefs(mapStore)
    const zoomLevel = ref<number>(0)
    const center = ref<[number, number]>([0, 0])
    
    watch(
        () => olMap.value,
        (mapInstance) => {
            if (!mapInstance) return

            const view = mapInstance.getView()

            const updateCenter = () => {
                const newCenter = view.getCenter()
                if (newCenter && newCenter[0] !== undefined && newCenter[1] !== undefined) {
                    center.value = [newCenter[0], newCenter[1]]
                }
            }

            // initial value
            zoomLevel.value = view.getZoom()
            updateCenter()

            // sync on change
            view.on('change:resolution', () => {
                zoomLevel.value = view.getZoom()
                console.log("CHANGE");
                
            })

            view.on('change:center', updateCenter)
            // During pan interactions this fires continuously while the pointer is moving.
            mapInstance.on('pointerdrag', updateCenter)

        },
        { immediate: true }
    )

    return {
        olMap,
        zoomLevel,
        center,
    }
}