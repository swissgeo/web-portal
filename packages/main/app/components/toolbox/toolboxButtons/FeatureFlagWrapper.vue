<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  featureFlagEnabled: boolean;
}>();

const { t } = useI18n();
</script>

<template>
  <UPopover
    mode="hover"
    enable-touch
    :content="{ side: 'left', sideOffset: 12 }"
  >
    <div>
      <slot :is-disabled="!featureFlagEnabled" />
    </div>

    <template #content v-if="!featureFlagEnabled">
      <div class="max-w-36 px-2 py-1 text-xs font-medium text-highlighted">
        <p>{{ t("toolbox.featureFlag.notAvailable") }}</p>
        <p class="mt-2">{{ t("toolbox.featureFlag.workingOnIt") }}</p>
      </div>
    </template>
  </UPopover>
</template>

<style scoped></style>
