<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

const { t } = useI18n();
</script>

<template>
  <ToolBoxButton
    data-testid="toolbox-print-button"
    :title="t('toolbox.print.buttonTitle')"
    :is-disabled="false"
    :is-active="false"
    iconName="printer"
  />
</template>

<style scoped></style>
