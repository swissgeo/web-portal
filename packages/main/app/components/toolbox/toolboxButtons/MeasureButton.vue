<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

const { t } = useI18n();
</script>

<template>
  <ToolBoxButton
    data-testid="toolbox-measure-button"
    :title="t('toolbox.measure.buttonTitle')"
    :is-disabled="false"
    :is-active="false"
    iconName="ruler"
  />
</template>

<style scoped></style>
