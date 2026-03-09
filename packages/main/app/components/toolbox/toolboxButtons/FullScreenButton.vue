<script setup lang="ts">
import ToolBoxButton from '@/components/toolbox/toolboxButtons/ToolBoxButton.vue'

const { t } = useI18n()

function toggleFullScreen() {
    throw new Error('Full screen mode toggle not yet implemented')
}

function isChromiumBrowser() {
    return 'chrome' in window
}

const isInWindowFullScreenModeNotChromium = computed(
    () =>
        window.innerWidth === screen.width &&
        window.innerHeight === screen.height &&
        !isChromiumBrowser()
)

function isDisabled(): boolean {
    return true
}
function isActive(): boolean {
    return false
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
    if (event.key === 'Escape' && !!document.fullscreenElement) {
        toggleFullScreen()
    }
}
</script>

<template>
    <div
        v-if="isInWindowFullScreenModeNotChromium"
        class="fullscreen-warning"
    >
        {{ t('full_screen_window_exit') }}
    </div>
    <ToolBoxButton
        title="Toggle full screen button"
        :is-disabled="isDisabled()"
        :is-active="isActive()"
        iconName="Expand"
        @click="toggleFullScreen()"
    />
</template>

<style scoped></style>
