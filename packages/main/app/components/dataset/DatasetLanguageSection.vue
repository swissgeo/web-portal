<script setup lang="ts">
import type { Language } from "@swissgeo/ogc";

import { useI18n } from "vue-i18n";

import DatasetLanguages from "./DatasetLanguages.vue";

const { t } = useI18n();

defineProps<{
  languages?: Language[];
}>();
</script>

<template>
  <section v-if="languages?.length" class="mt-auto shrink-0 pt-space-m">
    <h3 class="mb-space-xs text-base font-normal">
      {{ t("dataset.languages") }}
    </h3>
    <DatasetLanguages :languages="languages" />
  </section>
</template>
