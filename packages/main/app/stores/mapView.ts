import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Layer as MapLayer } from '@swissgeo/map'
import type { Dimension } from '@swissgeo/layers'

export const useMapViewStore = defineStore('mapView', () => {
    const isTimeSliderVisible = ref(false)
    const isFullscreenModeActive = ref(false)
    const mapLayers: Ref<MapLayer[]> = ref([])

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

    function updateLayerOpacity(opacity: number, index?: number, uuid?: string) {
        if (index !== undefined) {
            mapLayers.value[index].opacity = opacity
        } else if (uuid !== undefined) {
            mapLayers.value.find((layer) => layer.uuid === uuid).opacity = opacity
        }
    }

    function updateLayerDimension(
        index: number,
        dimension: Partial<Dimension>,
        dimensionId: string
    ) {
        if (!mapLayers.value[index].dimensions) {
            mapLayers.value[index].dimensions = {}
        }
        mapLayers.value[index].dimensions[dimensionId] = {
            ...mapLayers.value[index].dimensions[dimensionId],
            ...dimension,
        }
    }

    function removeLayer(index: number) {
        mapLayers.value.splice(index, 1)
    }

    function updateLayerData(index: number, mapLayer: MapLayer) {
        mapLayers.value[index] = mapLayer
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
        // values
        isTimeSliderVisible,
        isFullscreenModeActive,
        mapLayers,
        // getters
        getMapLayers,
        // actions
        toggleTimeSlider,
        closeTimeSlider,
        enterFullscreenMode,
        exitFullscreenMode,
        toggleFullscreenMode,
        updateLayerDimension,
        updateLayerData,
        updateLayerOpacity,
        removeLayer,
        addLayerToBottom,
        addLayerToTop,
    }
})
