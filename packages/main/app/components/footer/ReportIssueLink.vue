<script setup lang="ts">
import { createReusableTemplate, useMediaQuery } from "@vueuse/core";
import { useI18n } from "vue-i18n";

import ReportIssue from "./reportIssue/ReportIssue.vue";

const { t } = useI18n();
const isDesktop = useMediaQuery("(min-width: 768px)");
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
    <ULink
      target="_blank"
      raw
      class="flex items-center gap-1"
      @click="displayReportIssueForm = true"
    >
      <UIcon name="i-lucide-triangle-alert" class="size-3 shrink-0" />
      {{ t("toolbox.reportIssue.buttonTitle") }}
    </ULink>
  </ClientOnly>
</template>
