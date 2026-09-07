<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";
import { useToolboxStore } from "@/stores/toolbox";

const { t } = useI18n();
const toolboxStore = useToolboxStore();
</script>

<template>
  <ToolBoxButton
    data-testid="toolbox-report-issue-button"
    :title="t('toolbox.reportIssue.buttonTitle')"
    :is-disabled="false"
    :is-active="toolboxStore.isPanelActive('reportIssue')"
    iconName="bug"
    @click="toolboxStore.toggleDetailPanel('reportIssue')"
  />
</template>
