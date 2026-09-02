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
  feedback: z.string(t("toolbox.reportIssue.validation.feedbackRequired")),
  category: z.string(t("toolbox.reportIssue.validation.categoryRequired")),
  email: z.optional(z.email(t("toolbox.reportIssue.validation.emailInvalid"))),
  attachment: z
    .nullable(
      z
        .file(t("toolbox.reportIssue.validation.fileRequired"))
        .max(
          runtimeConfig.public.maxFileSizeMB * 1024 * 1024,
          t("toolbox.reportIssue.validation.fileTooLarge", {
            max: runtimeConfig.public.maxFileSizeMB,
          }),
        )
        .mime(
          ACCEPTED_FILE_TYPES,
          t("toolbox.reportIssue.validation.fileTypeNotSupported"),
        ),
    )
    .optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive({
  category: "",
  feedback: "",
  email: undefined as string | undefined,
  attachment: undefined as File | undefined,
});

const permalink = ref("");
const pending = ref(false);

function resetForm() {
  state.category = "";
  state.feedback = "";
  state.email = undefined;
  state.attachment = undefined;
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  pending.value = true;

  const formData = new FormData();
  formData.append("subject", "[Problem Report]");
  formData.append("feedback", state.feedback);
  formData.append("category", state.category);
  formData.append("version", runtimeConfig.public.version);
  formData.append("ua", navigator.userAgent);
  formData.append("permalink", permalink.value);

  if (state.email) {
    formData.append("email", state.email);
  }

  if (state.attachment) {
    formData.append("attachment", state.attachment);
  }

  try {
    await $fetch("/api/wpa/v1/report-issue", {
      method: "POST",
      body: formData,
    });

    toast.add({
      title: t("toolbox.reportIssue.successMessage"),
      color: "success",
    });
    resetForm();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : t("toolbox.reportIssue.errorMessage");
    toast.add({
      title: message,
      color: "error",
    });
  } finally {
    pending.value = false;
  }
}

watch(shareLink, (newLink) => {
  permalink.value = newLink || permalink.value;
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
      <ReportIssueCategory v-model="state.category" />

      <ReportIssueFeedback v-model="state.feedback" />

      <ReportIssueDrawOnMap />

      <ReportIssueEmail v-model="state.email" />

      <ReportIssueAttachment v-model="state.attachment" />

      <ReportIssueNotes :permalink="permalink" />

      <UButton type="reset" color="error" variant="outline" class="mr-2">
        {{ t("toolbox.reportIssue.cancelButton") }}
      </UButton>
      <UButton type="submit" :disabled="pending">
        {{ t("toolbox.reportIssue.submitButton") }}
      </UButton>
    </UForm>
  </UCard>
</template>
