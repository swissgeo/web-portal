<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineModel<File | undefined>({ required: true });

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/zip",
  "image/jpeg",
  "image/png",
  "application/vnd.google-earth.kml+xml",
  "application/vnd.google-earth.kmz",
  "application/gpx+xml",
  ".kml",
  ".kmz",
  ".gpx",
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
