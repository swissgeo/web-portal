<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

const { t } = useI18n();
</script>

<template>
  <div>
    <ToolBoxButton
      :title="t('toolbox.print.buttonTitle')"
      :is-disabled="false"
      :is-active="false"
      iconName="printer"
    />
  </div>
</template>

<style scoped></style>
