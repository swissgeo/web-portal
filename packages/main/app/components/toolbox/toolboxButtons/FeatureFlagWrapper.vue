<script setup lang="ts">
import { createReusableTemplate } from "@vueuse/core";
import { ref, useId } from "vue";
import { useI18n } from "vue-i18n";

defineProps<{
  featureFlagEnabled: boolean;
}>();

const { t } = useI18n();

const descriptionId = useId();
const popoverOpen = ref(false);

const [RegisterTemplate, ReuseTemplate] = createReusableTemplate();
</script>

<template>
  <RegisterTemplate>
    <slot :is-disabled="!featureFlagEnabled" />
  </RegisterTemplate>

  <template v-if="!featureFlagEnabled">
    <UPopover
      v-model:open="popoverOpen"
      mode="hover"
      enable-touch
      :content="{ side: 'left', sideOffset: 12 }"
    >
      <div
        tabindex="0"
        :aria-describedby="descriptionId"
        @focus="popoverOpen = true"
        @blur="popoverOpen = false"
      >
        <ReuseTemplate />
      </div>

      <template #content>
        <div class="max-w-36 px-2 py-1 text-xs font-medium text-highlighted">
          <p>{{ t("toolbox.featureFlag.notAvailable") }}</p>
          <p class="mt-2">{{ t("toolbox.featureFlag.workingOnIt") }}</p>
        </div>
      </template>
    </UPopover>

    <span :id="descriptionId" class="sr-only">
      {{ t("toolbox.featureFlag.notAvailable") }}
      {{ t("toolbox.featureFlag.workingOnIt") }}
    </span>
  </template>
  <template v-else>
    <ReuseTemplate />
  </template>
</template>

<style scoped></style>
