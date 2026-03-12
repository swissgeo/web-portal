import { useMapViewStore } from '~/stores/mapView'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

describe('mapView store', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('toggles fullscreen mode', () => {
        const mapViewStore = useMapViewStore()

        expect(mapViewStore.isFullscreenModeActive).toBe(false)

        mapViewStore.toggleFullscreenMode()
        expect(mapViewStore.isFullscreenModeActive).toBe(true)

        mapViewStore.toggleFullscreenMode()
        expect(mapViewStore.isFullscreenModeActive).toBe(false)
    })

    it('enters and exits fullscreen mode explicitly', () => {
        const mapViewStore = useMapViewStore()

        mapViewStore.enterFullscreenMode()
        expect(mapViewStore.isFullscreenModeActive).toBe(true)

        mapViewStore.exitFullscreenMode()
        expect(mapViewStore.isFullscreenModeActive).toBe(false)
    })

    it('keeps existing time slider behavior', () => {
        const mapViewStore = useMapViewStore()

        expect(mapViewStore.isTimeSliderVisible).toBe(false)

        mapViewStore.toggleTimeSlider()
        expect(mapViewStore.isTimeSliderVisible).toBe(true)

        mapViewStore.closeTimeSlider()
        expect(mapViewStore.isTimeSliderVisible).toBe(false)
    })
})
