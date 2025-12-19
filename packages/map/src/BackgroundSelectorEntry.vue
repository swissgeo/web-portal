<script lang="ts" setup>
import type { ServerLayer } from '@swissgeo/layers'

const {
    backgroundLayer,
    isCurrent = false,
    folded = false,
} = defineProps<{
    backgroundLayer: ServerLayer
    isCurrent: boolean
    folded?: boolean
}>()

const { getImageForBackgroundLayer } = useBackgroundSelector(() => {})

const emit = defineEmits(['click'])
</script>

<template>
    <button
        class="relative cursor-pointer rounded-lg border-4 border-solid border-[#343a40]"
        :class="{ active: isCurrent, 'w-[98px]': !folded, 'w-[39px]': folded }"
        type="button"
        :data-cy="`background-selector-${backgroundLayer?.uuid || 'void'}`"
        @click="emit('click')"
    >
        <span
            class="flex h-[65px] items-center justify-center overflow-hidden"
            :class="{ 'w-[90px]': !folded, 'w-[31px]': folded }"
        >
            <img
                class="h-full w-full"
                v-if="backgroundLayer"
                :src="getImageForBackgroundLayer(backgroundLayer)"
                alt="background image"
            />
        </span>
        <slot :folded="folded" />
        <span
            class="absolute right-0 bottom-0 left-0 w-full bg-[#343a40] opacity-75"
            :class="{ hidden: folded }"
        >
            <span class="block text-xs text-white">
                {{ $t(backgroundLayer?.record?.id || 'void_layer') }}
            </span>
        </span>
    </button>
</template>
