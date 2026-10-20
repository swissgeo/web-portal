<script setup lang="ts">
import { createReusableTemplate } from "@vueuse/core";
import { useI18n } from "vue-i18n";

defineProps<{
  featureFlagEnabled: boolean;
}>();

const { t } = useI18n();

const [RegisterTemplate, ReuseTemplate] = createReusableTemplate();
</script>

<template>
  <RegisterTemplate>
    <slot :is-disabled="!featureFlagEnabled" />
  </RegisterTemplate>

  <template v-if="!featureFlagEnabled">
    <UPopover
      mode="hover"
      enable-touch
      :content="{ side: 'left', sideOffset: 12 }"
    >
      <div>
        <ReuseTemplate />
      </div>

      <template #content>
        <div class="max-w-36 px-2 py-1 text-xs font-medium text-highlighted">
          <p>{{ t("toolbox.featureFlag.notAvailable") }}</p>
          <p class="mt-2">{{ t("toolbox.featureFlag.workingOnIt") }}</p>
        </div>
      </template>
    </UPopover>
  </template>
  <template v-else>
    <ReuseTemplate />
  </template>
</template>

<style scoped></style>
