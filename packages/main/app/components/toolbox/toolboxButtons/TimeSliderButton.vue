<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

const { t } = useI18n();
const mapViewStore = useMapViewStore();
</script>

<template>
  <ToolBoxButton
    data-testid="toolbox-time-slider-button"
    :title="t('toolbox.timeSlider.buttonTitle')"
    :is-disabled="false"
    :is-active="mapViewStore.isTimeSliderVisible"
    iconName="Timer-Reset"
    @click="mapViewStore.toggleTimeSlider()"
  />
</template>

<style scoped></style>
