<script setup lang="ts">
import type { SelectItem } from "@nuxt/ui";

import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineModel<string>({ required: true });

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
</script>

<template>
  <UFormField
    :label="t('toolbox.reportIssue.steps.step1.title')"
    name="category"
    required
  >
    <USelect
      :model-value="modelValue"
      :items="items"
      :placeholder="t('toolbox.reportIssue.steps.step1.select.placeholder')"
      :ui="{
        content: 'w-full',
        base: 'w-full',
      }"
      @update:model-value="$emit('update:modelValue', $event as string)"
    />
  </UFormField>
  <UButton
    :to="t('toolbox.reportIssue.steps.step1.moreInfo.url')"
    target="_blank"
    variant="link"
    class="pl-0"
    >{{ t("toolbox.reportIssue.steps.step1.moreInfo.label") }}</UButton
  >
</template>
