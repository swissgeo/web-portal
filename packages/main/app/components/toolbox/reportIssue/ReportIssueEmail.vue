<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineModel<string | undefined>({ required: true });
</script>

<template>
  <UFormField
    :label="t('toolbox.reportIssue.steps.step4.title')"
    name="email"
    :help="t('toolbox.reportIssue.steps.step4.info')"
  >
    <UInput
      :model-value="modelValue"
      :ui="{ root: 'w-full' }"
      :placeholder="t('toolbox.reportIssue.steps.step4.placeholder')"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </UFormField>
</template>
