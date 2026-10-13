<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";
import { useToolboxStore } from "@/stores/toolbox";

const { t } = useI18n();
const toolboxStore = useToolboxStore();
</script>

<template>
  <ToolBoxButton
    data-testid="toolbox-drawing-button"
    :title="t('toolbox.drawing.buttonTitle')"
    :is-disabled="false"
    :is-active="toolboxStore.isPanelActive('drawing')"
    iconName="pencil"
    @click="toolboxStore.toggleDetailPanel('drawing')"
  />
</template>

<style scoped></style>
