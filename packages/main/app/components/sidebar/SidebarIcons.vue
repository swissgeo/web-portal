<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import LayerCartButton from "./LayerCartButton.vue";

const { t } = useI18n();
</script>

<template>
  <nav :aria-label="t('menu.mapNavigation')" class="flex flex-col">
    <LayerCartButton></LayerCartButton>
  </nav>
</template>
