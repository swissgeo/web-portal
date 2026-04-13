<script lang="ts" setup>
import { inject } from 'vue'

defineEmits(['logoClick'])

const { condensed = false } = defineProps<{
    condensed?: boolean
}>()

const isDesktop = inject<boolean>('isDesktop', true)
</script>

<template>
    <!-- the desktop icon in the sidebar -->
    <div
        v-if="condensed"
        class="flex h-14 w-full cursor-pointer items-center justify-center"
        data-testid="sidebar-logo-pic-condensed"
        @click="$emit('logoClick')"
    >
        <img
            src="@/assets/images/swissgeo_rgb_icon.svg"
            class="h-5"
            data-testid="sidebar-logo-pic-image-condensed"
        />
    </div>
    <!-- the mobile one and when the sidebar is extended -->
    <div
        v-else
        class="flex h-10 items-center gap-2 bg-white"
        data-testid="sidebar-logo-pic-extended"
    >
        <div
            class="ml-3.5 flex translate-x-[0.5px] cursor-pointer items-center justify-center p-2"
            @click="$emit('logoClick')"
        >
            <img
                src="@/assets/images/swissgeo_rgb_sek.svg"
                class="h-5"
                data-testid="sidebar-logo-pic-image-extended"
            />
        </div>

        <div
            v-if="!isDesktop"
            class="flex items-center"
        >
            <!-- This is the separator between the logo and the language switch button -->
            <USeparator
                orientation="vertical"
                class="h-5 w-0.5 bg-gray-300"
                data-testid="sidebar-logo-pic-separator"
            />
        </div>
    </div>
</template>
