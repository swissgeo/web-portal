<script lang="ts" setup>
import { breakpointsTailwind } from "@vueuse/core";
import { displayModeKey } from "~/types/injectionKeys";

// Tailwind xl: the Topbar switches to desktop here.
const DESKTOP_LAYOUT_WIDTH = breakpointsTailwind.xl;

const toaster = {
  position: "top-center" as const,
  progress: false,
  duration: Infinity,
};
provide(displayModeKey, "web");

const { isEnabled } = useFeatureFlags();
// TODO GPS-1187: remove once the mobile UI ships (with MobileNotice and the
// enableMobileUi flag).
// While the mobile UI is off, phones get a desktop-wide layout viewport. All
// breakpoints then show the desktop UI, and the browser scales the page down
// to the screen. This replaces the default viewport from nuxt.config.ts.
if (!isEnabled("enableMobileUi")) {
  useHead({
    meta: [
      {
        name: "viewport",
        content: `width=${DESKTOP_LAYOUT_WIDTH}, interactive-widget=resizes-content`,
      },
    ],
  });
}
</script>

<template>
  <UApp :toaster="toaster">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
