<script setup lang="ts">
import { LucideIcon, useUiStore } from '@swissgeo/skeleton'

const { t } = useI18n()
const uiStore = useUiStore()

function toggleFullScreen() {
    throw new Error('Full screen mode toggle not yet implemented')
}
const isInWindowFullScreenModeNotChromium = computed(
    () => screen.width === uiStore.width && screen.height === uiStore.height && !window.chrome
)

function isDisabled(): boolean {
    return true
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
    if (event.key === 'Escape' && uiStore.fullscreenMode) {
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
    <button
        ref="fullscreenButton"
        class="toolbox-button d-print-none h-[40px] w-[40px] cursor-pointer rounded-[20px] bg-gray-500 text-white"
        :class="{ active: false }"
        :disabled="isDisabled()"
        data-cy="toolbox-fullscreen-button"
        @click="toggleFullScreen()"
    >
        <LucideIcon
            name="Expand"
            class="h-[40px] w-[40px]"
        />
    </button>
</template>

<style scoped>
/*@import '@/modules/map/scss/toolbox-buttons';

.fullscreen-warning {
    position: fixed;
    top: 120px;
    left: 50%;
    transform: translateX(-50%);
    background-color: black;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    font-size: 16px;
    z-index: 1000;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
    animation: fade-in-out 3s ease-in-out forwards;
}

@keyframes fade-in-out {
    0% {
        opacity: 0;
        visibility: visible;
    }

    10% {
        opacity: 0.9;
    }

    90% {
        opacity: 0.9;
    }

    100% {
        opacity: 0;
        visibility: hidden;
    }
} */
</style>
