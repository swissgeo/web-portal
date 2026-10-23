<script setup lang="ts">
import type { FeatureFlagPath } from "~/composables/useFeatureFlags";

import { useI18n } from "vue-i18n";

defineEmits<{ close: [] }>();

const { t } = useI18n();
const { allFlags, isEnabled, isOverridden, setFlag, resetFlags } =
  useFeatureFlags();

/**
 * enableCmsSearch is read directly from runtimeConfig by the skeleton search
 * store. Drop it once the store uses useFeatureFlags.
 */
const flags = computed(() =>
  allFlags.value.filter((flag) => flag !== "enableCmsSearch"),
);

function toggleFlag(path: FeatureFlagPath) {
  setFlag(path, !isEnabled(path));
}
</script>

<template>
  <div class="w-150 p-4 shadow">
    <div class="mb-2 flex items-center justify-between">
      <span class="text-sm font-semibold">
        {{ t("debug.featureFlagsPanelTitle") }}
      </span>
      <div class="flex items-center gap-2">
        <UButton
          color="primary"
          variant="outline"
          size="xs"
          data-testid="debug-reset-feature-flags"
          :label="t('debug.resetFeatureFlags')"
          @click="resetFlags()"
        />
        <UButton
          color="primary"
          variant="ghost"
          icon="i-lucide-x"
          title="Close"
          data-testid="debug-close-feature-flags-panel"
          @click="$emit('close')"
        />
      </div>
    </div>

    <ul class="flex flex-col gap-1">
      <li
        v-for="flag in flags"
        :key="flag"
        class="flex items-center justify-between gap-2"
      >
        <div class="flex items-center gap-2">
          <USwitch
            :model-value="isEnabled(flag)"
            size="sm"
            @update:model-value="toggleFlag(flag)"
          />
          <span class="font-mono text-sm">{{ flag }}</span>
        </div>
        <span
          v-if="isOverridden(flag)"
          class="rounded bg-warning/20 px-1.5 py-0.5 text-xs"
          data-testid="feature-flag-overridden"
        >
          {{ t("debug.featureFlagOverridden") }}
        </span>
      </li>
    </ul>
  </div>
</template>
