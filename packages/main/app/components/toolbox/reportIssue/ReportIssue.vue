<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { useToolboxStore } from "@/stores/toolbox";

const { t } = useI18n();

const toolboxStore = useToolboxStore();
</script>

<template>
  <UCard data-testid="toolbox-report-issue-card">
    <template #header>
      <div class="flex items-start justify-between">
        <div class="font-semibold text-highlighted">
          {{ t("toolbox.reportIssue.title") }}
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          size="sm"
          :aria-label="t('toolbox.reportIssue.close')"
          @click="toolboxStore.closeDetailPanel()"
        />
      </div>
    </template>
  </UCard>
</template>

<style scoped></style>
