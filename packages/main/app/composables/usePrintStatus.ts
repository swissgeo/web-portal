import { useMapStore } from "@swissgeo/map"

/**
 * Composable that triggers event sending to the print service when the map is fully loaded
 * and the UI elements are ready
 */
export function usePrintStatus() {
    const mapStore = useMapStore()
    const pageReady = ref(false)
    const printReady = computed(() => mapStore.isMapLoaded && pageReady.value)

    /**
     * Tells the UI elements of the page are ready
     */
    function setPageReady() {
        pageReady.value = true
    }

    watch(printReady, () => {
        // Send the readiness signal
        globalThis.postMessage({ type: "gaMapReady" })
    })

    return {
        setPageReady
    }
}