<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineModel<string>({ required: true });
</script>

<template>
  <UFormField
    :label="t('toolbox.reportIssue.steps.step2.title')"
    name="feedback"
    required
  >
    <UTextarea
      :model-value="modelValue"
      :ui="{
        root: 'w-full',
      }"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </UFormField>
</template>
