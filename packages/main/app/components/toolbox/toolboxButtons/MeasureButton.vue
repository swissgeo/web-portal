<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

import FeatureFlagWrapper from "./FeatureFlagWrapper.vue";

const { t } = useI18n();
const { isEnabled } = useFeatureFlags();
</script>

<template>
  <FeatureFlagWrapper
    :feature-flag-enabled="isEnabled('tools.enableMeasure')"
    v-slot="{ isDisabled }"
  >
    <ToolBoxButton
      data-testid="toolbox-measure-button"
      :title="t('toolbox.measure.buttonTitle')"
      :is-active="false"
      :isDisabled="isDisabled"
      iconName="ruler"
    />
  </FeatureFlagWrapper>
</template>

<style scoped></style>
