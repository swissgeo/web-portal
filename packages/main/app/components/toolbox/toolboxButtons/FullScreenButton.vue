<script setup lang="ts">
import { defaultDocument, useEventListener } from "@vueuse/core";
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

const { t } = useI18n();
const mapViewStore = useMapViewStore();

// In real fullscreen the browser consumes Escape itself, so leaving it is only
// observable through `fullscreenchange`. The keydown handler covers browsers
// without the Fullscreen API, where only the in-app layout is used.
useEventListener(defaultDocument, "fullscreenchange", () => {
  if (!document.fullscreenElement && mapViewStore.isFullscreenModeActive) {
    mapViewStore.exitFullscreenMode();
  }
});

useEventListener("keydown", (event: KeyboardEvent) => {
  if (event.key === "Escape" && mapViewStore.isFullscreenModeActive) {
    mapViewStore.exitFullscreenMode();
  }
});
</script>

<template>
  <ToolBoxButton
    data-testid="toolbox-fullscreen-button"
    :title="t('toolbox.fullscreen.buttonTitle')"
    :is-disabled="false"
    :is-active="mapViewStore.isFullscreenModeActive"
    iconName="fullscreen"
    @click="mapViewStore.toggleFullscreenMode()"
  />
</template>
