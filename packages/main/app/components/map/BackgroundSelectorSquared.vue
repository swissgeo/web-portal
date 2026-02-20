<script setup lang="ts">
import type { Layer } from '@swissgeo/layers'

import { CircleChevronRight } from 'lucide-vue-next'

import type { VoidLayer } from './useBackgroundSelector'

import useBackgroundSelector from './useBackgroundSelector'

const { backgroundLayers, currentBackgroundLayer } = defineProps<{
    backgroundLayers: (Layer | VoidLayer)[]
    currentBackgroundLayer: Layer | VoidLayer
}>()

const emit = defineEmits<{
    selectBackground: [backgroundLayer: Layer | VoidLayer]
}>()

function isCurrent(backgroundLayer: Layer | VoidLayer) {
    if (backgroundLayer === 'void' || currentBackgroundLayer === 'void') {
        return backgroundLayer === currentBackgroundLayer
    } else {
        return backgroundLayer?.uuid === currentBackgroundLayer?.uuid
    }
}

function selectBackgroundCallback(backgroundLayer: Layer | VoidLayer): void {
    if (backgroundLayer !== 'void') {
        if (isCurrent(backgroundLayer)) {
            // don't update if it's the same already, otherwise the user has a little
            // flicker and unnecessary computation power is used
            return
        }
    }
    emit('selectBackground', backgroundLayer)
}

function layerKey(layer: Layer | VoidLayer): string {
    return layer === 'void' ? 'void' : layer.uuid
}

const { selectorOpen, toggleShowSelector, onSelectBackground } =
    useBackgroundSelector(selectBackgroundCallback)
</script>

<template>
    <div class="bg-selector fixed right-4 bottom-4 flex items-end gap-2">
        <!--
            Each entry is animated individually so it can fly out from the trigger position.
            --reverse-index: 0 = closest to trigger (appears/disappears first), higher = further away.
            The translateX starting value is (reverse-index + 1) * button-step, which puts every
            button on top of the trigger before the transition kicks in.
        -->
        <TransitionGroup name="bg-option" tag="div" class="flex gap-2">
            <MapBackgroundSelectorEntry
                v-for="(backgroundLayer, index) in selectorOpen ? backgroundLayers : []"
                :key="layerKey(backgroundLayer)"
                :style="{ '--reverse-index': backgroundLayers.length - 1 - index }"
                :background-layer="backgroundLayer"
                :is-current="isCurrent(backgroundLayer)"
                @click="onSelectBackground(backgroundLayer)"
            />
        </TransitionGroup>
        <MapBackgroundSelectorEntry
            v-if="currentBackgroundLayer"
            :background-layer="currentBackgroundLayer"
            :folded="selectorOpen"
            :is-current="false"
            @click="toggleShowSelector"
        >
            <template v-slot="slotProps">
                <Transition name="bg-toggle-icon">
                    <div
                        v-if="slotProps.folded"
                        class="absolute inset-0 flex items-center justify-center rounded bg-[#343a40] text-white opacity-75"
                    >
                        <CircleChevronRight />
                    </div>
                </Transition>
            </template>
        </MapBackgroundSelectorEntry>
    </div>
</template>

<style scoped>
/*
 * Spread animation: each button starts stacked at the trigger position and
 * flies out to its own slot. The button closest to the trigger (--reverse-index: 0)
 * moves the shortest distance and appears first; further buttons follow with a
 * small staggered delay — matching the "burst" feel of the original.
 *
 * Button step = 98px (width) + 8px (gap) = 106px.
 */
.bg-option-enter-active {
    transition:
        opacity 0.4s ease,
        transform 0.4s ease;
    transition-delay: calc(var(--reverse-index, 0) * 0.05s);
}

.bg-option-leave-active {
    transition:
        opacity 0.25s ease,
        transform 0.25s ease;
    /* Reverse stagger on close: furthest button collapses first */
    transition-delay: calc((3 - var(--reverse-index, 0)) * 0.03s);
}

.bg-option-enter-from {
    opacity: 0;
    /* Start offset by the button's distance from the trigger */
    transform: translateX(calc((var(--reverse-index, 0) + 1) * 106px));
}

.bg-option-leave-to {
    opacity: 0;
    transform: translateX(calc((var(--reverse-index, 0) + 1) * 106px));
}

/* Fade the close-chevron overlay on the trigger button */
.bg-toggle-icon-enter-active,
.bg-toggle-icon-leave-active {
    transition: opacity 0.2s ease;
}

.bg-toggle-icon-enter-from,
.bg-toggle-icon-leave-to {
    opacity: 0;
}
</style>
