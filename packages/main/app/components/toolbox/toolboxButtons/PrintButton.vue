<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

import FeatureFlagWrapper from "./FeatureFlagWrapper.vue";

const { t } = useI18n();
const { isEnabled } = useFeatureFlags();
</script>

<template>
  <FeatureFlagWrapper
    :feature-flag-enabled="isEnabled('tools.enablePrint')"
    v-slot="{ isDisabled }"
  >
    <ToolBoxButton
      data-testid="toolbox-print-button"
      :title="t('toolbox.print.buttonTitle')"
      :is-disabled="isDisabled"
      :is-active="false"
      iconName="printer"
    />
  </FeatureFlagWrapper>
</template>

<style scoped></style>
