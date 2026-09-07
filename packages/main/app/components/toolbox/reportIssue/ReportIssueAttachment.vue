<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineModel<File | undefined>({ required: true });

const FILE_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/zip": "ZIP",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "application/vnd.google-earth.kml+xml": "KML",
  "application/vnd.google-earth.kmz": "KMZ",
  "application/gpx+xml": "GPX",
};

const ACCEPTED_FILE_TYPES = [
  ...Object.keys(FILE_TYPE_LABELS),
  ".kml",
  ".kmz",
  ".gpx",
];

const fileTypesLabels = Object.values(FILE_TYPE_LABELS);
</script>

<template>
  <UFormField
    :label="t('toolbox.reportIssue.steps.step5.title')"
    name="attachment"
  >
    <UFileUpload
      :model-value="modelValue"
      :label="t('toolbox.reportIssue.steps.step5.buttonLabel')"
      :description="fileTypesLabels.join(', ')"
      :accept="ACCEPTED_FILE_TYPES.join(',')"
      @update:model-value="
        $emit('update:modelValue', $event as File | undefined)
      "
    />
  </UFormField>
</template>
