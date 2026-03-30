<script setup lang="ts">
import type { ActionDispatcher } from '@swissgeo/map'

import { usePositionStore } from '@swissgeo/map'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import ToolBoxButton from '@/components/toolbox/toolboxButtons/ToolBoxButton.vue'
import { useGeolocationStore } from '@/stores/geolocation'

const dispatcher: ActionDispatcher = { name: 'GeolocButton.vue' }

const { t } = useI18n()
const geolocationStore = useGeolocationStore()
const positionStore = usePositionStore()

const title = computed(() => {
    if (geolocationStore.denied) {
        return t('geolocation.permissionDenied')
    }
    if (geolocationStore.active) {
        return t('geolocation.stopTracking')
    }
    return t('geolocation.startTracking')
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
