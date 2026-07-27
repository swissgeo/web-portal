<script setup lang="ts">
import type { ActionDispatcher } from "@swissgeo/shared";

import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";
import { useGeolocationStore } from "@/stores/geolocation";

const dispatcher: ActionDispatcher = { name: "GeolocButton.vue" };

const { t } = useI18n();
const geolocationStore = useGeolocationStore();

function toggleGeolocation(): void {
  geolocationStore.toggleGeolocation(dispatcher);
}
</script>

<template>
  <div ref="geolocationButton" class="geoloc-button-div">
    <ToolBoxButton
      :title="t('toolbox.geolocation.buttonTitle')"
      :is-disabled="geolocationStore.denied"
      :is-active="geolocationStore.active"
      iconName="locate-fixed"
      @click="toggleGeolocation()"
    />
  </div>
</template>

<style scoped></style>
