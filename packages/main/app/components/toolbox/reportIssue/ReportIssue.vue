<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";

import { useI18n } from "vue-i18n";
import * as z from "zod";

import { useToolboxStore } from "@/stores/toolbox";

import ReportIssueAttachment from "./ReportIssueAttachment.vue";
import ReportIssueCategory from "./ReportIssueCategory.vue";
import ReportIssueDrawOnMap from "./ReportIssueDrawOnMap.vue";
import ReportIssueEmail from "./ReportIssueEmail.vue";
import ReportIssueFeedback from "./ReportIssueFeedback.vue";
import ReportIssueNotes from "./ReportIssueNotes.vue";

const { t } = useI18n();
const toast = useToast();
const runtimeConfig = useRuntimeConfig();
const toolboxStore = useToolboxStore();
const { exportState } = useStateConfig();
const { shareLink } = useCreateShareLink(exportState, {
  autoRefresh: true,
});

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/zip",
  "image/jpeg",
  "image/png",
  "application/vnd.google-earth.kml+xml",
  "application/vnd.google-earth.kmz",
  "application/gpx+xml",
];

const schema = z.object({
  subject: z.string("Subject is required"),
  feedback: z.string("Feedback is required"),
  category: z.string("Category is required"),
  version: z.string("Version is required"),
  ua: z.string("User agent is required"),
  permalink: z.string("Permalink is required"),
  email: z.optional(z.email("Email must be a valid email address")),
  attachment: z.optional(
    z
      .file("Attachment must be a file")
      .max(
        runtimeConfig.public.maxFileSizeMB * 1024 * 1024,
        `File is too large (max ${runtimeConfig.public.maxFileSizeMB} MB)`,
      )
      .mime(ACCEPTED_FILE_TYPES, "File type not supported"),
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  subject: "[Problem Report]",
  category: "",
  feedback: "",
  version: "",
  ua: "",
  permalink: "",
  email: undefined,
  attachment: undefined,
});

function onSubmit(event: FormSubmitEvent<Schema>) {
  toast.add({
    title: "Success",
    description: "The form has been submitted.",
    color: "success",
  });
  state.subject = event.data.subject;
}

onMounted(() => {
  state.ua = navigator.userAgent;
  state.version = runtimeConfig.public.version;
});

watch(shareLink, (newLink) => {
  state.permalink = newLink || state.permalink;
});
</script>

<template>
  <UCard
    data-testid="toolbox-report-issue-card"
    :ui="{
      body: 'md:max-h-[75vh] md:overflow-x-scroll',
    }"
  >
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
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <ReportIssueCategory v-model="state.category!" />

      <ReportIssueFeedback v-model="state.feedback!" />

      <ReportIssueDrawOnMap />

      <ReportIssueEmail v-model="state.email" />

      <ReportIssueAttachment v-model="state.attachment" />

      <ReportIssueNotes :permalink="state.permalink ?? ''" />

      <UButton type="reset" color="error" variant="outline" class="mr-2">
        {{ t("toolbox.reportIssue.cancelButton") }}
      </UButton>
      <UButton type="submit">
        {{ t("toolbox.reportIssue.submitButton") }}
      </UButton>
    </UForm>
  </UCard>
</template>
