<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

const { t } = useI18n();
const mapViewStore = useMapViewStore();

function toggleFullScreen() {
  mapViewStore.toggleFullscreenMode();
}

onMounted(() => {
  bindEscapeKeyToExitFullScreenMode();
});
onUnmounted(() => {
  unbindEscapeKey();
});

function bindEscapeKeyToExitFullScreenMode(): void {
  window.addEventListener("keydown", handleKeydown);
}

function unbindEscapeKey(): void {
  window.removeEventListener("keydown", handleKeydown);
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && mapViewStore.isFullscreenModeActive) {
    mapViewStore.exitFullscreenMode();
  }
}
</script>

<template>
  <ToolBoxButton
    data-testid="fullscreen-toggle"
    :title="t('toolbox.fullscreen.buttonTitle')"
    :is-disabled="false"
    :is-active="mapViewStore.isFullscreenModeActive"
    iconName="maximize-2"
    @click="toggleFullScreen()"
  />
</template>

<style scoped></style>
