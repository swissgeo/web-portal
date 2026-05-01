import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMapViewStore = defineStore('mapView', () => {
    const isTimeSliderVisible = ref(false)
    const isFullscreenModeActive = ref(false)
    const stateId = ref('')

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

    function setStateId(id: string) {
        stateId.value = id
    }

    return {
        isTimeSliderVisible,
        isFullscreenModeActive,
        toggleTimeSlider,
        closeTimeSlider,
        enterFullscreenMode,
        exitFullscreenMode,
        toggleFullscreenMode,
        stateId,
        setStateId,
    }
})
