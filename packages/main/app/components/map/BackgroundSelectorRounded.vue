<script setup lang="ts">
import type { Layer } from '@swissgeo/layers'

import useBackgroundSelector from './useBackgroundSelector'

const { backgroundLayers, currentBackgroundLayer } = defineProps<{
    backgroundLayers: (Layer | null)[]
    currentBackgroundLayer: Layer | null
}>()

const emit = defineEmits<{
    selectBackground: [backgroundLayer: Layer | null]
}>()

function isCurrent(backgroundLayer: Layer | null) {
    if (backgroundLayer === null || currentBackgroundLayer === null) {
        return backgroundLayer === currentBackgroundLayer
    } else {
        return backgroundLayer?.uuid === currentBackgroundLayer?.uuid
    }
}

function selectBackgroundCallback(backgroundLayer: Layer | null): void {
    if (isCurrent(backgroundLayer)) {
        return
    }
    emit('selectBackground', backgroundLayer)
}

function layerKey(layer: Layer | null): string {
    return layer === null ? 'void' : layer.uuid
}

const { selectorOpen, toggleShowSelector, onSelectBackground, getImageForBackgroundLayer } =
    useBackgroundSelector(selectBackgroundCallback)
</script>

<template>
    <!--
        Fixed at bottom-left. The outer flex-col keeps the trigger at the bottom;
        the options container grows upward above it when open.
    -->
    <div class="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2 sm:hidden">
        <!--
            Buttons spread upward from the trigger position.
            --reverse-index: 0 = closest to trigger (appears first), higher = further away.
            translateY offset is proportional so each button appears to fly out
            from the trigger point.
            Button step = 50px height + 8px gap = 58px.
        -->
        <TransitionGroup
            name="bg-round-option"
            tag="div"
            class="flex flex-col gap-2"
        >
            <button
                v-for="(backgroundLayer, index) in selectorOpen ? backgroundLayers : []"
                :key="layerKey(backgroundLayer)"
                :style="{
                    '--reverse-index': backgroundLayers.length - 1 - index,
                    '--max-index': backgroundLayers.length - 1,
                }"
                class="bg-round-btn cursor-pointer overflow-hidden rounded-full border-4 border-solid border-[#343a40]"
                :class="{ active: isCurrent(backgroundLayer) }"
                type="button"
                :data-cy="layerKey(backgroundLayer)"
                @click="onSelectBackground(backgroundLayer)"
            >
                <img
                    class="h-full w-full object-cover"
                    :src="getImageForBackgroundLayer(backgroundLayer)"
                    alt="background"
                />
            </button>
        </TransitionGroup>

        <!-- Trigger: shows the current background; thicker border when open -->
        <button
            class="bg-round-btn bg-round-trigger cursor-pointer overflow-hidden rounded-full border-solid border-[#343a40]"
            :class="{ open: selectorOpen }"
            type="button"
            data-cy="background-selector-trigger"
            @click="toggleShowSelector"
        >
            <img
                class="h-full w-full object-cover"
                :src="getImageForBackgroundLayer(currentBackgroundLayer)"
                alt="current background"
            />
        </button>
    </div>
</template>

<style scoped>
.bg-round-btn {
    width: 50px;
    height: 50px;
    flex-shrink: 0;
}

.bg-round-btn.active {
    border-color: #dc2626;
}

/* Trigger gets a thicker border and red highlight when the panel is open */
.bg-round-trigger {
    border-width: 4px;
    transition:
        border-width 0.2s ease,
        border-color 0.2s ease;
}

.bg-round-trigger.open {
    border-width: 6px;
    border-color: #dc2626;
}

/*
 * Spread upward: each button starts at the trigger position (positive translateY = below)
 * and slides up to its natural slot.
 * Closest button (--reverse-index: 0) moves the least and appears first.
 */
.bg-round-option-enter-active {
    transition:
        opacity 0.4s ease,
        transform 0.4s ease;
    transition-delay: calc(var(--reverse-index, 0) * 0.05s);
}

.bg-round-option-leave-active {
    transition:
        opacity 0.25s ease,
        transform 0.25s ease;
    /* Reverse stagger on close: farthest button collapses first */
    transition-delay: calc((var(--max-index, 3) - var(--reverse-index, 0)) * 0.03s);
}

.bg-round-option-enter-from {
    opacity: 0;
    transform: translateY(calc((var(--reverse-index, 0) + 1) * 58px));
}

.bg-round-option-leave-to {
    opacity: 0;
    transform: translateY(calc((var(--reverse-index, 0) + 1) * 58px));
}
</style>
