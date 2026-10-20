<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";
import { useToolboxStore } from "@/stores/toolbox";

import FeatureFlagWrapper from "./FeatureFlagWrapper.vue";

const { t } = useI18n();
const { isEnabled } = useFeatureFlags();
const toolboxStore = useToolboxStore();
</script>

<template>
  <FeatureFlagWrapper
    :feature-flag-enabled="isEnabled('tools.enableImport')"
    v-slot="{ isDisabled }"
  >
    <ToolBoxButton
      data-testid="toolbox-import-button"
      :title="t('toolbox.import.buttonTitle')"
      :is-disabled="isDisabled"
      :is-active="toolboxStore.isPanelActive('import')"
      iconName="upload"
      @click="toolboxStore.toggleDetailPanel('import')"
    />
  </FeatureFlagWrapper>
</template>
