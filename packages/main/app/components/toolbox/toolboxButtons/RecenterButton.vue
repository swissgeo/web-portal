<script setup lang="ts">
import type { ActionDispatcher } from '@swissgeo/shared/action-dispatcher'

import { usePositionStore } from '@swissgeo/map'
import { LucideIcon } from '@swissgeo/skeleton'

const dispatcher: ActionDispatcher = { name: 'RecenterButton.vue' }

const positionStore = usePositionStore()

function isDisabled(): boolean {
    return true
}

function toggleTracking(): void {
    throw new Error('GEOLOCATION NOT IMPLEMENTED, SO WE CANNOT RECENTER')
    // Toggle tracking mode
    const newTrackingState = false

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
        class="h-[40px] w-[40px] cursor-pointer rounded-[20px] bg-black text-white"
        data-cy="recenter-button"
        :disabled="isDisabled()"
        type="button"
        @click="toggleTracking"
    >
        <LucideIcon
            name="Shrink"
            class="h-[40px] w-[40px]"
        />
    </button>
</template>

<style scoped>
/*@import '@/modules/map/scss/toolbox-buttons';*/
</style>
