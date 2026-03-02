<script setup lang="ts">
import type { ActionDispatcher } from '@swissgeo/shared/action-dispatcher'

import { usePositionStore } from '@swissgeo/map'
import ToolBoxButton from '@/components/toolbox/toolboxButtons/ToolBoxButton.vue'

const dispatcher: ActionDispatcher = { name: 'ZoomButtons.vue' }

const positionStore = usePositionStore()

function increaseZoom() {
    positionStore.increaseZoom(dispatcher)
}

function decreaseZoom() {
    positionStore.decreaseZoom(dispatcher)
}
</script>

<template>
    <ToolBoxButton
        title="Zoom In button"
        :is-disabled="false"
        :is-active="true"
        iconName="Plus"
        @click="increaseZoom()"
    /><ToolBoxButton
        title="Zoom out button"
        :is-disabled="false"
        :is-active="true"
        iconName="Minus"
        @click="decreaseZoom()"
    />
</template>

<style scoped></style>
