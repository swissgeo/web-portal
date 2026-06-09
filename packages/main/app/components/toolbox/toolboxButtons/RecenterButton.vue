<script setup lang="ts">
import type { ActionDispatcher } from "@swissgeo/shared";

import { usePositionStore } from "@swissgeo/map";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";
import { useGeolocationStore } from "@/stores/geolocation";

const dispatcher: ActionDispatcher = { name: "RecenterButton.vue" };

const { t } = useI18n();
const geolocationStore = useGeolocationStore();
const positionStore = usePositionStore();

const title = computed(() => {
  if (geolocationStore.tracking) {
    return t("geolocation.stopTracking");
  }
  return t("geolocation.recenterMap");
});

function toggleTracking(): void {
  if (geolocationStore.tracking) {
    // Disable tracking, auto-rotation, and reset rotation to north
    geolocationStore.setGeolocationTracking(false, dispatcher);
    positionStore.setAutoRotation(false, dispatcher);
    positionStore.setRotation(0, dispatcher);
  } else {
    // Enable tracking and auto-rotation
    geolocationStore.setGeolocationTracking(true, dispatcher);
    positionStore.setAutoRotation(true, dispatcher);
  }
}
</script>

<template>
  <ToolBoxButton
    :title="title"
    :is-disabled="false"
    :is-active="geolocationStore.tracking"
    iconName="Shrink"
    @click="toggleTracking()"
  />
</template>

<style scoped></style>
