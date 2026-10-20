<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";
import { useToolboxStore } from "@/stores/toolbox";

import FeatureFlagWrapper from "./FeatureFlagWrapper.vue";

const { t } = useI18n();
const config = useRuntimeConfig();
const toolboxStore = useToolboxStore();
</script>

<template>
  <FeatureFlagWrapper
    :feature-flag-enabled="config.public.featureFlags.tools.enableDrawing"
    v-slot="{ isDisabled }"
  >
    <ToolBoxButton
      data-testid="toolbox-drawing-button"
      :title="t('toolbox.drawing.buttonTitle')"
      :is-disabled="isDisabled"
      :is-active="toolboxStore.isPanelActive('drawing')"
      iconName="pencil"
      @click="toolboxStore.toggleDetailPanel('drawing')"
    />
  </FeatureFlagWrapper>
</template>

<style scoped></style>
