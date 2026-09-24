<script setup lang="ts">
import { createReusableTemplate } from "@vueuse/core";
import { useI18n } from "vue-i18n";

import ReportIssue from "./reportIssue/ReportIssue.vue";

const { t } = useI18n();
const isDesktop = useIsDesktop();
const [RegisterTemplate, ReuseTemplate] = createReusableTemplate();

const displayReportIssueForm = ref(false);
</script>
<template>
  <ClientOnly>
    <RegisterTemplate>
      <ReportIssue @close="displayReportIssueForm = false" />
    </RegisterTemplate>
    <div
      v-if="displayReportIssueForm && isDesktop"
      class="absolute right-24 bottom-full mb-2 w-96"
    >
      <ReuseTemplate />
    </div>

    <UDrawer
      v-if="displayReportIssueForm && !isDesktop"
      :default-open="true"
      :modal="false"
      @close="displayReportIssueForm = false"
    >
      <template #body>
        <ReuseTemplate />
      </template>
    </UDrawer>
    <UButton
      variant="link"
      color="error"
      :size="isDesktop ? 'sm' : 'sm'"
      class="gap-1 px-0"
      @click="displayReportIssueForm = true"
    >
      <UIcon name="i-lucide-triangle-alert" class="size-3 shrink-0" />
      {{ t("footer.reportIssue.buttonTitle") }}
    </UButton>
  </ClientOnly>
</template>
