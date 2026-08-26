<script setup lang="ts">
import type { SelectItem, FormSubmitEvent } from "@nuxt/ui";

import { useI18n } from "vue-i18n";
import * as z from "zod";

import { useToolboxStore } from "@/stores/toolbox";

const { t } = useI18n();
const toast = useToast();
const runtimeConfig = useRuntimeConfig();
const toolboxStore = useToolboxStore();

const items = ref<SelectItem[]>([
  {
    label: t("toolbox.reportIssue.steps.step1.select.options.background"),
    value: "background",
  },
  {
    label: t("toolbox.reportIssue.steps.step1.select.options.thematic"),
    value: "thematic",
  },
  {
    label: t("toolbox.reportIssue.steps.step1.select.options.application"),
    value: "application",
  },
  {
    label: t("toolbox.reportIssue.steps.step1.select.options.other"),
    value: "other",
  },
]);

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/zip",
  "image/jpeg",
  "image/png",
  "application/vnd.google-earth.kml+xml",
  "application/vnd.google-earth.kmz",
  "application/gpx+xml",
];
const fileTypesLabels = computed(() => {
  return ACCEPTED_FILE_TYPES.map((type) => {
    switch (type) {
      case "application/pdf":
        return "PDF";
      case "application/zip":
        return "ZIP";
      case "image/jpeg":
        return "JPG";
      case "image/png":
        return "PNG";
      case "application/vnd.google-earth.kml+xml":
        return "KML";
      case "application/vnd.google-earth.kmz":
        return "KMZ";
      case "application/gpx+xml":
        return "GPX";
      default:
        return type;
    }
  });
});

const schema = z.object({
  subject: z.string("Subject is required"),
  feedback: z.string("Feedback is required"),
  category: z.string("Category is required"),
  version: z.string("Version is required"),
  ua: z.string("User agent is required"),
  permalink: z.string("Permalink is required"),
  email: z.optional(z.email("Email must be a valid email address")),
  attachment: z.optional(z.file("Attachment must be a file")),
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

async function onSubmit(event: FormSubmitEvent<Schema>) {
  toast.add({
    title: "Success",
    description: "The form has been submitted.",
    color: "success",
  });
  console.log(event.data);
}

onMounted(() => {
  state.ua = navigator.userAgent;
  state.version = runtimeConfig.public.version;
});
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
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField
        :label="t('toolbox.reportIssue.steps.step1.title')"
        name="category"
        required
      >
        <USelect
          v-model="state.category"
          :items="items"
          :placeholder="t('toolbox.reportIssue.steps.step1.select.placeholder')"
          :ui="{
            content: 'w-full',
            base: 'w-full',
          }"
        />
      </UFormField>
      <UButton
        :to="t('toolbox.reportIssue.steps.step1.moreInfo.url')"
        target="_blank"
        variant="link"
        class="pl-0"
        >{{ t("toolbox.reportIssue.steps.step1.moreInfo.label") }}</UButton
      >

      <UFormField
        :label="t('toolbox.reportIssue.steps.step2.title')"
        name="feedback"
        required
      >
        <UTextarea
          v-model="state.feedback"
          :ui="{
            root: 'w-full',
          }"
        />
      </UFormField>

      <UFormField
        :label="t('toolbox.reportIssue.steps.step3.title')"
        name="drawOnMap"
      >
        <UButton disabled>{{
          t("toolbox.reportIssue.steps.step3.button")
        }}</UButton>
      </UFormField>

      <UFormField
        :label="t('toolbox.reportIssue.steps.step4.title')"
        name="email"
        :help="t('toolbox.reportIssue.steps.step4.info')"
      >
        <UInput
          v-model="state.email"
          :ui="{ root: 'w-full' }"
          :placeholder="t('toolbox.reportIssue.steps.step4.placeholder')"
        />
      </UFormField>

      <UFormField
        :label="t('toolbox.reportIssue.steps.step5.title')"
        name="attachment"
      >
        <UFileUpload
          v-model="state.attachment"
          :label="t('toolbox.reportIssue.steps.step5.buttonLabel')"
          :description="fileTypesLabels.join(', ')"
          :accept="ACCEPTED_FILE_TYPES.join(',')"
        />
      </UFormField>

      <UButton type="reset" color="error" variant="outline" class="mr-2">
        {{ t("toolbox.reportIssue.cancelButton") }}
      </UButton>
      <UButton type="submit">
        {{ t("toolbox.reportIssue.submitButton") }}
      </UButton>
    </UForm>
  </UCard>
</template>

<style scoped></style>
