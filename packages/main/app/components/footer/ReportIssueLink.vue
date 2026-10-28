<script setup lang="ts">
import { createReusableTemplate } from "@vueuse/core";
import { useI18n } from "vue-i18n";

import ReportIssue from "./reportIssue/ReportIssue.vue";

const { t } = useI18n();
const isDesktop = useIsDesktop();
const { isEnabled } = useFeatureFlags();
const { reportIssuePortalUrl } = useRuntimeConfig().public;
const [RegisterTemplate, ReuseTemplate] = createReusableTemplate();

const displayReportIssueForm = ref(false);
</script>
<template>
  <ClientOnly>
    <UButton
      v-if="!isEnabled('enableReportIssueForm')"
      variant="link"
      color="error"
      size="sm"
      class="gap-1 px-0"
      :to="reportIssuePortalUrl"
      target="_blank"
      external
    >
      <UIcon name="i-lucide-triangle-alert" class="size-3 shrink-0" />
      {{ t("footer.reportIssue.buttonTitle") }}
    </UButton>
    <template v-else>
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
        :ui="{
          content: !isDesktop ? 'rounded-none' : '',
        }"
      >
        <template #body>
          <ReuseTemplate />
        </template>
      </UDrawer>
      <UButton
        variant="link"
        color="error"
        size="sm"
        class="gap-1 px-0"
        @click="displayReportIssueForm = true"
      >
        <UIcon name="i-lucide-triangle-alert" class="size-3 shrink-0" />
        {{ t("footer.reportIssue.buttonTitle") }}
      </UButton>
    </template>
  </ClientOnly>
</template>
