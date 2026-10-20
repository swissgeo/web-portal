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
    :feature-flag-enabled="isEnabled('tools.enableShare')"
    v-slot="{ isDisabled }"
  >
    <ToolBoxButton
      data-testid="toolbox-share-button"
      :title="t('toolbox.share.buttonTitle')"
      :is-disabled="isDisabled"
      :is-active="toolboxStore.isPanelActive('share')"
      iconName="share-2"
      @click="toolboxStore.toggleDetailPanel('share')"
    />
  </FeatureFlagWrapper>
</template>
