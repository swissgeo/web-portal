<script lang="ts" setup>
import type { AsyncDataRequestStatus } from "#app";

import LayerCatalogLoadingStatus from "./LayerCatalogLoadingStatus.vue";

const { parentLabel, currentLabel, status } = defineProps<{
  parentLabel: string | undefined;
  currentLabel: string | undefined;
  /** Loading status of the concepts */
  status: AsyncDataRequestStatus;
}>();
</script>

<template>
  <LayerCatalogLoadingStatus :status>
    <div class="flex min-w-0 flex-col gap-1.5">
      <p
        v-if="parentLabel"
        class="text-accent truncate text-xs leading-small-text font-bold"
      >
        {{ parentLabel }}
      </p>
      <h4 class="truncate text-highlighted">{{ currentLabel }}</h4>
    </div>
  </LayerCatalogLoadingStatus>
</template>
