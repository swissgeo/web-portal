<script lang="ts" setup>
import type { AsyncDataRequestStatus } from "#app";

import { useI18n } from "vue-i18n";

const { t } = useI18n();

const { parentLabel, currentLabel, status } = defineProps<{
  parentLabel: string | undefined;
  currentLabel: string | undefined;
  /** Loading status of the concepts */
  status: AsyncDataRequestStatus;
}>();
</script>

<template>
  <p v-if="status === 'error'" class="text-sm leading-small-text text-error">
    {{ t("layerCatalog.error") }}
  </p>
  <p
    v-else-if="status !== 'success'"
    class="text-sm leading-small-text text-muted"
  >
    {{ t("layerCatalog.loading") }}
  </p>
  <div v-else class="flex min-w-0 flex-col gap-1.5">
    <p
      v-if="parentLabel"
      class="text-accent truncate text-xs leading-small-text font-bold"
    >
      {{ parentLabel }}
    </p>
    <h4 class="truncate text-highlighted">{{ currentLabel }}</h4>
  </div>
</template>
