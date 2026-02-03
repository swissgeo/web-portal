<script setup lang="ts">
//import GeoadminTooltip from '@swissgeo/tooltip'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { ActionDispatcher } from '@/stores/types'

//import useGeolocationStore from '@/stores/geolocation'
import usePositionStore from '@/stores/position'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faArrowsToCircle } from '@fortawesome/free-solid-svg-icons'

const dispatcher: ActionDispatcher = { name: 'RecenterButton.vue' }

//const geolocationStore = useGeolocationStore()

const geolocationStoreMockup = {
    denied: true,
    active: false,
    toggleGeolocation: (dispatcher: ActionDispatcher) => {
        throw new Error('Toggle Geolocation is not implemented yet')
        return 'Toggle Geolocation is not implemented yet ' + dispatcher.name
    },
    setGeolocationTracking: (bool: boolean, dispatcher: ActionDispatcher) => {
        throw new Error('Setting Geolocation tracking is not implemented yet')
        if (bool) {
            return dispatcher
        }
        return 'false'
    },
    tracking: false,
    position: undefined,
}
const positionStore = usePositionStore()
const { t } = useI18n()

// Show recenter button when geolocation is active but not tracking
const showRecenterButton = computed(() => {
    return (
        geolocationStoreMockup.active &&
        geolocationStoreMockup.position !== undefined &&
        !geolocationStoreMockup.tracking
    )
})

// Tooltip always shows "re-center map" since button is hidden when tracking
const tooltipContent = 're_center_map'

function toggleTracking(): void {
    // Toggle tracking mode
    const newTrackingState = !geolocationStoreMockup.tracking
    geolocationStoreMockup.setGeolocationTracking(newTrackingState, dispatcher)

    // If enabling tracking and device has orientation, enable auto-rotation
    if (newTrackingState && positionStore.hasOrientation) {
        positionStore.setAutoRotation(true, dispatcher)
    } else if (!newTrackingState) {
        // If disabling tracking, also disable auto-rotation and reset rotation
        if (positionStore.autoRotation) {
            positionStore.setRotation(0, dispatcher)
            positionStore.setAutoRotation(false, dispatcher)
        }
    }
}
</script>

<template>
    <button
        class="toolbox-button d-print-none"
        data-cy="recenter-button"
        type="button"
        @click="toggleTracking"
    >
        <FontAwesomeIcon
            :icon="faArrowsToCircle"
            transform="shrink-2"
        />
    </button>
</template>

<style scoped>
/*@import '@/modules/map/scss/toolbox-buttons';*/
</style>
