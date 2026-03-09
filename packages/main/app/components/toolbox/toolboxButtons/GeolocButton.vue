<script setup lang="ts">
import ToolBoxButton from '@/components/toolbox/toolboxButtons/ToolBoxButton.vue'

function isDisabled(): boolean {
    return true
}
function isActive(): boolean {
    return false
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
        <ToolBoxButton
            title="Geolocation toggle button"
            :is-disabled="isDisabled()"
            :is-active="isActive()"
            iconName="Map-Pinned"
            @click="toggleGeolocation()"
        />
    </div>
</template>

<style scoped></style>
