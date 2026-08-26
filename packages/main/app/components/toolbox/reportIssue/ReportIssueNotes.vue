<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps<{
  permalink: string;
}>();
</script>

<template>
  <div class="mt-2 text-sm text-muted">
    {{ t("toolbox.reportIssue.notes.link.label") }}
    <UButton
      :to="permalink"
      variant="link"
      class="p-0"
      target="_blank"
      >{{ t("toolbox.reportIssue.notes.link.permalink") }}</UButton
    >.
  </div>
  <div class="mt-2 text-sm text-muted">
    {{ t("toolbox.reportIssue.notes.tos.label") }}
    <UButton
      :to="t('toolbox.reportIssue.notes.tos.url')"
      variant="link"
      class="p-0"
      target="_blank"
      >{{ t("toolbox.reportIssue.notes.tos.link") }}</UButton
    >.
  </div>
</template>
