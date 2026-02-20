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

const { selectorOpen, toggleShowSelector, onSelectBackground } =
    useBackgroundSelector(selectBackgroundCallback)
</script>

<template>
    <div class="bg-selector fixed right-4 bottom-4 flex items-end gap-2">
        <Transition name="bg-options">
            <div v-if="selectorOpen" class="flex gap-2">
                <MapBackgroundSelectorEntry
                    v-for="(backgroundLayer, index) in backgroundLayers"
                    :key="index"
                    :background-layer="backgroundLayer"
                    :is-current="isCurrent(backgroundLayer)"
                    @click="onSelectBackground(backgroundLayer)"
                />
            </div>
        </Transition>
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
/* Slide-in from the right when the options panel opens */
.bg-options-enter-active,
.bg-options-leave-active {
    transition:
        opacity 0.3s ease,
        transform 0.3s ease;
}

.bg-options-enter-from,
.bg-options-leave-to {
    opacity: 0;
    transform: translateX(20px);
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
