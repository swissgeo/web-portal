<script lang="ts" setup>
import type { AsyncDataRequestStatus } from "#app";

import { useI18n } from "vue-i18n";

const { t } = useI18n();

const { status } = defineProps<{
  /** Loading status of the data the content shows */
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
  <slot v-else />
</template>
