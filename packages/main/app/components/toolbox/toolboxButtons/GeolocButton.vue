<script setup lang="ts">
import { LucideIcon } from '@swissgeo/skeleton'

function isDisabled(): boolean {
    return true
}
function toggleGeolocation(): void {
    throw new Error('GEOLOCATION NOT YET IMPLEMENTED')
}
</script>

<template>
    <div
        ref="geolocationButton"
        class="geoloc-button-div"
    >
        <button
            class="toolbox-button d-print-none h-[40px] w-[40px] cursor-pointer rounded-[20px] bg-gray-500 text-white"
            type="button"
            :disabled="isDisabled()"
            data-cy="geolocation-button"
            @click="toggleGeolocation"
        >
            <LucideIcon
                name="MapPinned"
                class="h-[40px] w-[40px]"
            />
        </button>
    </div>
</template>

<style scoped></style>
