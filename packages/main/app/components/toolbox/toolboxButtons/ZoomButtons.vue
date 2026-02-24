<script setup lang="ts">
import type { ActionDispatcher } from '@swissgeo/shared/action-dispatcher'

import { usePositionStore } from '@swissgeo/map'
import { LucideIcon } from '@swissgeo/skeleton'

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
    <button
        ref="zoomInButton"
        class="toolbox-button d-print-none h-[40px] w-[40px] cursor-pointer rounded-[20px] bg-black text-white hover:bg-blue-500"
        data-cy="zoom-in"
        @click="increaseZoom"
    >
        <LucideIcon
            name="Plus"
            class="h-[40px] w-[40px]"
        />
    </button>
    <button
        ref="zoomOutButton"
        class="toolbox-button d-print-none h-[40px] w-[40px] cursor-pointer rounded-[20px] bg-black text-white hover:bg-blue-500"
        data-cy="zoom-out"
        @click="decreaseZoom"
    >
        <LucideIcon
            name="Minus"
            class="h-[40px] w-[40px]"
        />
    </button>
</template>

<style scoped></style>
