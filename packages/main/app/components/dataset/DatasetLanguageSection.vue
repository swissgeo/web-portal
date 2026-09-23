<script setup lang="ts">
import type { Language } from "@swissgeo/ogc";

import DatasetLanguages from "./DatasetLanguages.vue";

defineProps<{
  languages?: Language[];
}>();
</script>

<template>
  <section v-if="languages?.length" class="mt-space-m">
    <h3 class="mb-space-xs text-base font-normal">
      {{ $t("dataset.languages") }}
    </h3>
    <DatasetLanguages :languages="languages" />
  </section>
</template>
