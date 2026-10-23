<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

import FeatureFlagWrapper from "./FeatureFlagWrapper.vue";

const { t } = useI18n();
const { isEnabled } = useFeatureFlags();
const mapViewStore = useMapViewStore();
</script>

<template>
  <FeatureFlagWrapper
    :feature-flag-enabled="isEnabled('tools.enableCompare')"
    v-slot="{ isDisabled }"
  >
    <ToolBoxButton
      data-testid="toolbox-compare-slider-button"
      :title="t('toolbox.compare.buttonTitle')"
      :is-active="mapViewStore.isCompareSliderActive"
      :is-disabled="isDisabled"
      iconName="square-split-horizontal"
      @click="mapViewStore.toggleCompareSlider()"
    />
  </FeatureFlagWrapper>
</template>
