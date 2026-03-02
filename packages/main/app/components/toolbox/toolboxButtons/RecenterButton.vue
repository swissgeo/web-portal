<script setup lang="ts">
// import type { ActionDispatcher } from '@swissgeo/shared/action-dispatcher'

// import { usePositionStore } from '@swissgeo/map'
import ToolBoxButton from '@/components/toolbox/toolboxButtons/ToolBoxButton.vue'

// const dispatcher: ActionDispatcher = { name: 'RecenterButton.vue' }

// const positionStore = usePositionStore()

function isDisabled(): boolean {
    return true
}
function toggleTracking(): void {
    throw new Error('GEOLOCATION NOT IMPLEMENTED, SO WE CANNOT RECENTER')
    // Toggle tracking mode
    // const newTrackingState = false

    // If enabling tracking and device has orientation, enable auto-rotation
    // if (newTrackingState && positionStore.hasOrientation) {
    //     positionStore.setAutoRotation(true, dispatcher)
    // } else if (!newTrackingState) {
    //     // If disabling tracking, also disable auto-rotation and reset rotation
    //     if (positionStore.autoRotation) {
    //         positionStore.setRotation(0, dispatcher)
    //         positionStore.setAutoRotation(false, dispatcher)
    //     }
    // }
}
</script>

<template>
    <ToolBoxButton
        title="Recenter button"
        :is-disabled="isDisabled()"
        :is-active="false"
        iconName="Shrink"
        @click="toggleTracking()"
    />
</template>

<style scoped>
/*@import '@/modules/map/scss/toolbox-buttons';*/
</style>
