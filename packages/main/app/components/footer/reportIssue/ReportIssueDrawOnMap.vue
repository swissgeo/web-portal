<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <UFormField
    :label="t('toolbox.reportIssue.steps.step3.title')"
    name="drawOnMap"
  >
    <UButton disabled>{{
      t("toolbox.reportIssue.steps.step3.button")
    }}</UButton>
  </UFormField>
</template>
