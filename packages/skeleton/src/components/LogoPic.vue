<script lang="ts" setup>
import { inject } from "vue";

defineEmits(["logo-click"]);

const { condensed = false } = defineProps<{
  condensed?: boolean;
}>();

const isDesktop = inject<boolean>("isDesktop", true);
</script>

<template>
    <!-- the desktop icon in the sidebar -->
    <div v-if="condensed" class="flex h-14 w-full items-center justify-center">
        <img src="@/assets/images/swissgeo_rgb_icon.svg" class="h-5" />
    </div>
    <!-- the mobile one and when the sidebar is extended -->
    <div
        v-else
        class="flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white lg:h-14 lg:gap-0 lg:rounded-none lg:border-none"
    >
        <div
            class="ml-3.5 flex translate-x-[0.5px] cursor-pointer items-center justify-center p-2"
            @click="$emit('logo-click')"
        >
            <img src="@/assets/images/swissgeo_rgb_sek.svg" class="h-5" />
        </div>

        <div v-if="!isDesktop" class="flex items-center">
            <!-- This is the separator between the logo and the language switch button -->
            <div class="mx-3 inline-block h-5 w-0.5 bg-gray-300" />
        </div>
    </div>
</template>
