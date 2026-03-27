<script setup lang="ts">
import type { ActionDispatcher } from '@swissgeo/map'

import ToolBoxButton from '@/components/toolbox/toolboxButtons/ToolBoxButton.vue'
import { useGeolocationStore } from '@/stores/geolocation'

const dispatcher: ActionDispatcher = { name: 'RecenterButton.vue' }

const geolocationStore = useGeolocationStore()

function toggleTracking(): void {
    geolocationStore.setGeolocationTracking(true, dispatcher)
}
</script>

<template>
    <ToolBoxButton
        title="Re-center map on location"
        :is-disabled="false"
        :is-active="false"
        iconName="Shrink"
        @click="toggleTracking()"
    />
</template>

<style scoped></style>
