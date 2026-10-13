<script lang="ts" setup>
import { inject } from "vue";

defineEmits(["logoClick"]);

const { condensed = false, darkMode = false } = defineProps<{
  condensed?: boolean;
  darkMode?: boolean;
}>();

const isDesktop = inject<boolean>("isDesktop", true);
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
      v-if="!darkMode"
      src="@/assets/images/swissgeo_rgb_icon.svg"
      class="h-5"
      data-testid="sidebar-logo-pic-image-condensed"
    />
    <img
      v-else
      src="@/assets/images/swissgeo_sw_icon.svg"
      class="h-5"
      data-testid="sidebar-logo-pic-image-condensed"
    />
  </div>
  <!-- the mobile one and when the sidebar is extended -->
  <div
    v-else
    class="flex h-10 items-center gap-2"
    data-testid="sidebar-logo-pic-extended"
  >
    <div
      class="flex cursor-pointer items-center justify-center py-2"
      @click="$emit('logoClick')"
    >
      <img
        v-if="!darkMode"
        src="@/assets/images/swissgeo_rgb_sek.svg"
        class="h-5"
        data-testid="sidebar-logo-pic-image-extended"
      />
      <img
        v-else
        src="@/assets/images/swissgeo_neg_sek.svg"
        class="h-5"
        data-testid="sidebar-logo-pic-image-extended"
      />
    </div>

    <div v-if="!isDesktop" class="flex items-center">
      <!-- This is the separator between the logo and the language switch button -->
      <USeparator
        orientation="vertical"
        class="h-5 w-0.5 bg-gray-300"
        data-testid="sidebar-logo-pic-separator"
      />
    </div>
  </div>
</template>
