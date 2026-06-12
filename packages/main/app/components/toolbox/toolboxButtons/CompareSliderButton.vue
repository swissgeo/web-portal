<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

const { t } = useI18n();
const mapViewStore = useMapViewStore();
</script>

<template>
  <div>
    <ToolBoxButton
      :title="t('compareSlider.toggleButtonTitle')"
      :is-active="mapViewStore.isCompareSliderActive"
      :is-disabled="false"
      iconName="Columns-2"
      @click="mapViewStore.toggleCompareSlider()"
    />
  </div>
</template>
