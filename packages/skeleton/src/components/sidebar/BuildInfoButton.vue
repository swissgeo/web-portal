<script lang="ts" setup>
import LucideIcon from '@/components/LucideIcon.vue'

const config = useRuntimeConfig()

const gitCommit = config.public.gitCommit as string
const buildTime = config.public.buildTime as string

const iconRef = ref<HTMLElement | null>(null)
const popupRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const popupTop = ref(0)
const popupLeft = ref(0)
const arrowOffset = ref(12) // px from top of popup to center of arrow

async function showPopup() {
    if (!iconRef.value) {
        return
    }

    const rect = iconRef.value.getBoundingClientRect()
    popupLeft.value = rect.right + 8
    // Tentatively align popup top with icon top
    popupTop.value = rect.top
    isVisible.value = true

    await nextTick()

    if (popupRef.value) {
        const popupHeight = popupRef.value.offsetHeight
        const margin = 8
        const maxTop = window.innerHeight - popupHeight - margin
        const clampedTop = Math.min(rect.top, maxTop)
        popupTop.value = clampedTop
        // Keep arrow pointing at the vertical center of the icon
        arrowOffset.value = rect.top + rect.height / 2 - clampedTop - 6
    }
}
</script>

<template>
    <div
        ref="iconRef"
        class="flex h-10 w-10 items-center justify-center"
        @mouseenter="showPopup"
        @mouseleave="isVisible = false"
    >
        <LucideIcon
            name="Info"
            class="w-5 cursor-default text-cyan-900 opacity-50"
        />
    </div>
    <Teleport to="body">
        <div
            ref="popupRef"
            v-show="isVisible"
            class="pointer-events-none fixed rounded border border-neutral-200 bg-white px-3 py-2 text-xs leading-relaxed whitespace-nowrap shadow-md"
            style="z-index: 999999"
            :style="{ top: `${popupTop}px`, left: `${popupLeft}px` }"
        >
            <!-- Callout arrow pointing left toward the icon -->
            <span
                class="absolute -left-1.5 h-3 w-3 rotate-45 border-b border-l border-neutral-200 bg-white"
                :style="{ top: `${arrowOffset}px` }"
            ></span>
            <div><span class="font-semibold">Commit:</span> {{ gitCommit }}</div>
            <div><span class="font-semibold">Built:</span> {{ buildTime }}</div>
        </div>
    </Teleport>
</template>
