<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";
import { useToolboxStore } from "@/stores/toolbox";

const { t } = useI18n();
const toolboxStore = useToolboxStore();
</script>

<template>
  <ToolBoxButton
    data-testid="toolbox-import-button"
    :title="t('toolbox.import.buttonTitle')"
    :is-disabled="false"
    :is-active="toolboxStore.isPanelActive('import')"
    iconName="upload"
    @click="toolboxStore.toggleDetailPanel('import')"
  />
</template>
