<script lang="ts" setup>
import type { Layer } from '@swissgeo/layers'

import type { VoidLayer } from '@/composables/useBackgroundSelector'

import { AVAILABLE_BACKGROUNDS } from '@/constants'

const {
    backgroundLayer,
    isCurrent = false,
    folded = false,
} = defineProps<{
    backgroundLayer: Layer | VoidLayer
    isCurrent: boolean
    folded?: boolean
}>()
const { t } = useI18n()
const { getImageForBackgroundLayer } = useBackgroundSelector(() => { })

const emit = defineEmits(['click'])
const cyId = computed(() => (backgroundLayer === 'void' ? 'void' : backgroundLayer.uuid))
const layerTranslationKey = computed(() =>
    mapBackgroundLayerToTranslationKey(backgroundLayer)
)

function mapBackgroundLayerToTranslationKey(layer: Layer | VoidLayer): string {
    let translationKey = ''
    if (layer === 'void') {
        translationKey = 'backgroundLayers.voidMap'
    } else if (layer.dataset.id == AVAILABLE_BACKGROUNDS[0]) {
        translationKey = `backgroundLayers.greyMap`
    } else if (layer.dataset.id == AVAILABLE_BACKGROUNDS[1]) {
        translationKey = `backgroundLayers.colorMap`
    } else if (layer.dataset.id == AVAILABLE_BACKGROUNDS[2]) {
        translationKey = `backgroundLayers.swissimage`
    }
    return t(translationKey)
}
</script>

<template>
    <button class="relative cursor-pointer rounded-lg border-4 border-solid border-[#343a40]"
            :class="{ active: isCurrent, 'w-[98px]': !folded, 'w-[39px]': folded }" type="button" :data-cy="cyId"
            @click="emit('click')">
        <span class="flex h-[65px] items-center justify-center overflow-hidden"
              :class="{ 'w-[90px]': !folded, 'w-[31px]': folded }">
            <img class="h-full w-full" v-if="backgroundLayer" :src="getImageForBackgroundLayer(backgroundLayer)"
                 alt="background image" />
        </span>
        <slot :folded="folded" />
        <span class="absolute right-0 bottom-0 left-0 w-full bg-[#343a40] opacity-75" :class="{ hidden: folded }">
            <span class="block text-xs text-white">
                {{ layerTranslationKey }}
            </span>
        </span>
    </button>
</template>
