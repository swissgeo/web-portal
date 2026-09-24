<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";

import { useI18n } from "vue-i18n";
import * as z from "zod";

import ReportIssueAttachment from "./ReportIssueAttachment.vue";
import ReportIssueCategory from "./ReportIssueCategory.vue";
import { ACCEPTED_MIME_TYPES } from "./reportIssueConstants";
import ReportIssueDrawOnMap from "./ReportIssueDrawOnMap.vue";
import ReportIssueEmail from "./ReportIssueEmail.vue";
import ReportIssueFeedback from "./ReportIssueFeedback.vue";
import ReportIssueNotes from "./ReportIssueNotes.vue";

const { t } = useI18n();
const toast = useToaster();
const runtimeConfig = useRuntimeConfig();
const { exportState } = useStateConfig();
const { shareLink } = useCreateShareLink(exportState, {
  autoRefresh: true,
});

const emit = defineEmits<{
  close: [];
}>();

const schema = z.object({
  feedback: z
    .string()
    .trim()
    .min(1, t("footer.reportIssue.validation.feedbackRequired")),
  category: z
    .string()
    .trim()
    .min(1, t("footer.reportIssue.validation.categoryRequired")),
  email: z
    .optional(z.email(t("footer.reportIssue.validation.emailInvalid")))
    .or(z.literal("")),
  attachment: z
    .nullable(
      z
        .file(t("footer.reportIssue.validation.fileRequired"))
        .max(
          runtimeConfig.public.maxFileSizeMB * 1024 * 1024,
          t("footer.reportIssue.validation.fileTooLarge", {
            max: runtimeConfig.public.maxFileSizeMB,
          }),
        )
        .mime(
          ACCEPTED_MIME_TYPES,
          t("footer.reportIssue.validation.fileTypeNotSupported"),
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
  formData.append("state", JSON.stringify(exportState.value));

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
      title: t("footer.reportIssue.successMessage"),
      color: "success",
    });
    resetForm();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : t("footer.reportIssue.errorMessage");
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
    data-testid="footer-report-issue-card"
    :ui="{
      body: 'md:max-h-[75vh] md:overflow-y-scroll',
      root: 'ring-0 md:ring',
      header: 'border-0 md:border-b',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-triangle-alert"
            class="size-5 text-highlighted"
          />
          <div class="text-base font-semibold text-highlighted">
            {{ t("footer.reportIssue.title") }}
          </div>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          size="sm"
          :aria-label="t('footer.reportIssue.close')"
          @click="emit('close')"
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

      <div class="flex flex-row justify-between">
        <UButton size="xl" type="reset" variant="ghost" class="mr-2">
          {{ t("footer.reportIssue.cancelButton") }}
        </UButton>
        <UButton size="xl" type="submit" :disabled="pending">
          {{ t("footer.reportIssue.submitButton") }}
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
