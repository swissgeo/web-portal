<script setup lang="ts">
import type { ActionDispatcher } from '@swissgeo/map'

import { usePositionStore } from '@swissgeo/map'
import { computed } from 'vue'

import ToolBoxButton from '@/components/toolbox/toolboxButtons/ToolBoxButton.vue'
import { useGeolocationStore } from '@/stores/geolocation'

const dispatcher: ActionDispatcher = { name: 'GeolocButton.vue' }

const geolocationStore = useGeolocationStore()
const positionStore = usePositionStore()

const title = computed(() => {
    if (geolocationStore.denied) {
        return 'Location permission denied'
    }
    if (geolocationStore.active) {
        return 'Stop tracking'
    }
    return 'Start tracking'
})

function toggleGeolocation(): void {
    geolocationStore.toggleGeolocation(dispatcher)

    // If turning off geolocation, also disable tracking and auto-rotation
    if (!geolocationStore.active) {
        geolocationStore.setGeolocationTracking(false, dispatcher)
        if (positionStore.autoRotation) {
            positionStore.setRotation(0, dispatcher)
            positionStore.setAutoRotation(false, dispatcher)
        }
    }
}
</script>

<template>
    <div
        ref="geolocationButton"
        class="geoloc-button-div"
    >
        <ToolBoxButton
            :title="title"
            :is-disabled="geolocationStore.denied"
            :is-active="geolocationStore.active"
            iconName="Map-Pinned"
            @click="toggleGeolocation()"
        />
    </div>
</template>

<style scoped></style>
