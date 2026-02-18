import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMapViewStore = defineStore('mapView', () => {
    const isTimeSliderVisible = ref(false)

    function toggleTimeSlider() {
        isTimeSliderVisible.value = !isTimeSliderVisible.value
    }

    function closeTimeSlider() {
        isTimeSliderVisible.value = false
    }

    return {
        isTimeSliderVisible,
        toggleTimeSlider,
        closeTimeSlider,
    }
})
