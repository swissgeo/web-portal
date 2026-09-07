<script setup lang="ts">
import { useI18n } from "vue-i18n";

import {
  ACCEPTED_FILE_TYPES,
  FILE_TYPE_LABEL_LIST,
} from "./reportIssueConstants";

const { t } = useI18n();

defineModel<File | undefined>({ required: true });
</script>

<template>
  <UFormField
    :label="t('toolbox.reportIssue.steps.step5.title')"
    name="attachment"
  >
    <UFileUpload
      :model-value="modelValue"
      :label="t('toolbox.reportIssue.steps.step5.buttonLabel')"
      :description="FILE_TYPE_LABEL_LIST.join(', ')"
      :accept="ACCEPTED_FILE_TYPES.join(',')"
      @update:model-value="
        $emit('update:modelValue', $event as File | undefined)
      "
    />
  </UFormField>
</template>
