<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <UFormField
    :label="t('footer.reportIssue.steps.step3.title')"
    name="drawOnMap"
  >
    <UButton disabled>{{ t("footer.reportIssue.steps.step3.button") }}</UButton>
  </UFormField>
</template>
