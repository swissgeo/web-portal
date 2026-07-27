<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

const { t } = useI18n();
const mapViewStore = useMapViewStore();
</script>

<template>
  <div>
    <ToolBoxButton
      :title="t('toolbox.timeSlider.buttonTitle')"
      :is-disabled="false"
      :is-active="mapViewStore.isTimeSliderVisible"
      iconName="Timer-Reset"
      @click="mapViewStore.toggleTimeSlider()"
    />
  </div>
</template>

<style scoped></style>
