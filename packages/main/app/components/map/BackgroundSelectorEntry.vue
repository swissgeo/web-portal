<script lang="ts" setup>
import type { Layer } from '@swissgeo/layers'

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { AVAILABLE_BACKGROUNDS } from './constants'
import useBackgroundSelector from './useBackgroundSelector'

const {
    backgroundLayer,
    isCurrent = false,
    folded = false,
} = defineProps<{
    backgroundLayer: Layer | null
    isCurrent: boolean
    folded?: boolean
}>()
const { t } = useI18n()
const { getImageForBackgroundLayer } = useBackgroundSelector(() => {})

const emit = defineEmits(['click'])
const cyId = computed(() => (backgroundLayer === null ? 'void' : backgroundLayer.uuid))
const layerTranslationKey = computed(() => mapBackgroundLayerToTranslationKey(backgroundLayer))

function mapBackgroundLayerToTranslationKey(layer: Layer | null): string {
    let translationKey = ''
    if (layer === null) {
        translationKey = 'backgroundLayers.voidMap'
    } else if (layer.dataset?.id === AVAILABLE_BACKGROUNDS[0]) {
        translationKey = `backgroundLayers.greyMap`
    } else if (layer.dataset?.id === AVAILABLE_BACKGROUNDS[1]) {
        translationKey = `backgroundLayers.colorMap`
    } else if (layer.dataset?.id === AVAILABLE_BACKGROUNDS[2]) {
        translationKey = `backgroundLayers.swissimage`
    }
    return t(translationKey)
}
</script>

<template>
    <button
        class="bg-entry relative cursor-pointer overflow-hidden rounded-lg border-4 border-solid border-[#343a40]"
        :class="{ active: isCurrent, folded }"
        type="button"
        :data-cy="cyId"
        @click="emit('click')"
    >
        <span class="bg-entry-image flex h-[65px] items-center justify-center overflow-hidden">
            <img
                class="h-full w-full object-cover"
                :src="getImageForBackgroundLayer(backgroundLayer)"
                alt="background image"
            />
        </span>
        <slot :folded="folded" />
        <span class="bg-entry-label absolute right-0 bottom-0 left-0 bg-[rgba(52,58,64,0.75)]">
            <span class="block text-xs text-white">
                {{ layerTranslationKey }}
            </span>
        </span>
    </button>
</template>

<style scoped>
.bg-entry {
    width: 98px;
    transition:
        width 0.3s ease,
        border-color 0.2s ease;
}

.bg-entry.folded {
    width: 39px;
}

.bg-entry.active {
    border-color: #dc2626;
}

.bg-entry-image {
    width: 90px;
    transition: width 0.3s ease;
}

.bg-entry.folded .bg-entry-image {
    width: 31px;
}

.bg-entry-label {
    transition: opacity 0.2s ease;
}

.bg-entry.folded .bg-entry-label {
    opacity: 0;
    pointer-events: none;
}

@media (max-width: 480px) {
    .bg-entry {
        width: 72px;
    }

    .bg-entry.folded {
        width: 32px;
    }

    .bg-entry-image {
        width: 64px;
    }

    .bg-entry.folded .bg-entry-image {
        width: 24px;
    }
}
</style>
