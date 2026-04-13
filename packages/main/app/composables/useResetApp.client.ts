import { useLayerStore } from '@swissgeo/layers'
import { usePositionStore } from '@swissgeo/map'

export function useResetApp() {
    // we only want this on the client side
    if (import.meta.client) {
        const { clear: clearSessionStorage } = useRestoreState()

        const layerStore = useLayerStore()
        const positionStore = usePositionStore()

        function resetApp() {
            clearSessionStorage()
            layerStore.$reset()
            positionStore.$reset()
        }

        return { resetApp }
    } else {
        // returning a stupid placeholder for SSR
        function resetApp() {}
        return {
            resetApp,
        }
    }
}
