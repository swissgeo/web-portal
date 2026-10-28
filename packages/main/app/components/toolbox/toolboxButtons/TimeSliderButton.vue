<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

import FeatureFlagWrapper from "./FeatureFlagWrapper.vue";

const { t } = useI18n();
const mapViewStore = useMapViewStore();
const { isEnabled } = useFeatureFlags();
</script>

<template>
  <FeatureFlagWrapper
    :feature-flag-enabled="isEnabled('tools.enableTimeSlider')"
    v-slot="{ isDisabled }"
  >
    <ToolBoxButton
      data-testid="toolbox-time-slider-button"
      :title="t('toolbox.timeSlider.buttonTitle')"
      :is-disabled="isDisabled"
      :is-active="mapViewStore.isTimeSliderVisible"
      iconName="Timer-Reset"
      @click="mapViewStore.toggleTimeSlider()"
    />
  </FeatureFlagWrapper>
</template>

<style scoped></style>
