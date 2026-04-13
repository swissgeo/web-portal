<script setup lang="ts">
import ToolBoxButton from '@/components/toolbox/toolboxButtons/ToolBoxButton.vue'

const mapViewStore = useMapViewStore()

function toggleFullScreen() {
    mapViewStore.toggleFullscreenMode()
}

onMounted(() => {
    bindEscapeKeyToExitFullScreenMode()
})
onUnmounted(() => {
    unbindEscapeKey()
})

function bindEscapeKeyToExitFullScreenMode(): void {
    window.addEventListener('keydown', handleKeydown)
}

function unbindEscapeKey(): void {
    window.removeEventListener('keydown', handleKeydown)
}

function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && mapViewStore.isFullscreenModeActive) {
        mapViewStore.exitFullscreenMode()
    }
}
</script>

<template>
    <ToolBoxButton
        data-cy="fullscreen-toggle"
        title="Toggle full screen button"
        :is-disabled="false"
        :is-active="mapViewStore.isFullscreenModeActive"
        iconName="Expand"
        @click="toggleFullScreen()"
    />
</template>

<style scoped></style>
