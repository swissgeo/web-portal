import type { Layer as MapLayer } from '@swissgeo/map'

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMapViewStore = defineStore('mapView', () => {
    const isTimeSliderVisible = ref(false)
    const isFullscreenModeActive = ref(false)
    const mapLayers: Ref<MapLayer[]> = ref([])

    /**
     * Gets either an index or an uuid to identify a layer withing the map Layers,
     * and return the index at which the layer is.
     *
     *
     * @param identifier either the index in the array, or the layer's uuid
     * @returns the index itself, or the index found
     * @throws Error if the uuid is not found within the array
     */
    function _getIndexFromIdentifier(identifier: string | number): number {
        const index =
            typeof identifier === 'number'
                ? identifier
                : mapLayers.value.findIndex((layer) => layer.uuid === identifier)

        if (index < 0) {
            throw new Error(`Incorrect identifier given : ${identifier}`)
        }
        return index
    }
    function getMapLayers(): Ref<MapLayer[]> {
        // returning the Ref so the reactivity is packed within
        return mapLayers
    }

    function addLayerToTop(mapLayer: MapLayer) {
        mapLayers.value.push(mapLayer)
    }

    function addLayerToBottom(mapLayer: MapLayer) {
        mapLayers.value.unshift(mapLayer)
    }

    /**
     * Set a layer to a specific index in the layers array.
     * Handles validation to ensure the target index is within bounds and differs from current position.
     */
    function setLayerIndex(identifier: string | number, targetIndex: number): void {
        const currentIndex = _getIndexFromIdentifier(identifier)

        // Validate: current index must be found, target must be in valid range, and must be different
        if (
            currentIndex >= 0 &&
            targetIndex < mapLayers.value.length &&
            targetIndex >= 0 &&
            currentIndex !== targetIndex
        ) {
            const [layer] = mapLayers.value.splice(currentIndex, 1) as [MapLayer]
            mapLayers.value.splice(targetIndex, 0, layer)
        }
    }

    /** Move a layer one step up in the visual stack (toward top, higher index). */
    function moveLayerUp(identifier: string | number): void {
        setLayerIndex(identifier, _getIndexFromIdentifier(identifier) + 1)
    }

    /** Move a layer one step down in the visual stack (toward bottom, lower index). */
    function moveLayerDown(identifier: string | number): void {
        setLayerIndex(identifier, _getIndexFromIdentifier(identifier) - 1)
    }
    function updateLayerOpacity(identifier: string | number, opacity: number) {
        mapLayers.value[_getIndexFromIdentifier(identifier)].opacity = opacity
    }

    function updateLayerDimension(
        index: number,
        dimension: Partial<Dimension>,
        dimensionId: string
    ) {
        if (!mapLayers.value[index]!.dimensions) {
            mapLayers.value[index]!.dimensions = {}
        }
        mapLayers.value[index]!.dimensions[dimensionId] = {
            ...mapLayers.value[index]!.dimensions[dimensionId],
            ...dimension,
        }
    }

    function removeLayer(identifier: string | number) {
        mapLayers.value.splice(_getIndexFromIdentifier(identifier), 1)
    }

    function updateLayerData(identifier: string | number, mapLayer: MapLayer) {
        mapLayers.value[_getIndexFromIdentifier(identifier)] = mapLayer
    }

    function toggleTimeSlider() {
        isTimeSliderVisible.value = !isTimeSliderVisible.value
    }

    function closeTimeSlider() {
        isTimeSliderVisible.value = false
    }

    function enterFullscreenMode() {
        isFullscreenModeActive.value = true
    }

    function exitFullscreenMode() {
        isFullscreenModeActive.value = false
    }

    function toggleFullscreenMode() {
        isFullscreenModeActive.value = !isFullscreenModeActive.value
    }

    return {
        // getters
        getMapLayers,
        isTimeSliderVisible,
        isFullscreenModeActive,

        // setters

        // actions
        addLayerToTop,
        addLayerToBottom,
        toggleTimeSlider,
        closeTimeSlider,
        enterFullscreenMode,
        exitFullscreenMode,
        toggleFullscreenMode,
        moveLayerUp,
        moveLayerDown,
        updateLayerOpacity,
        updateLayerData,
        updateLayerDimension,
        removeLayer,
    }
})
