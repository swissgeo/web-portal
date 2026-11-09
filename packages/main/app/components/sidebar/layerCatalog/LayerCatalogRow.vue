<script lang="ts" setup>
import type { Dataset } from "@swissgeo/ogc";

import { isMappableDataset } from "@swissgeo/ogc";
import { useId } from "vue";
import { useI18n } from "vue-i18n";

const { dataset } = defineProps<{
  dataset: Dataset;
}>();

const { t } = useI18n();
const isDesktop = useIsDesktop();
const localePath = useLocalePath();
const detailPath = computed(() => localePath(`/dataset/${dataset.id}`));
// On mobile the title opens the detail view, like the info button
const titlePath = computed(() =>
  isDesktop.value ? undefined : detailPath.value,
);

const { isOnMap, addToMap, removeFromMap } = useDatasetLayer(() => dataset);
const isMappable = computed(() => isMappableDataset(dataset));
const hintId = useId();

const ownerName = computed(() => dataset.properties.owner?.name);

async function setOnMap(onMap: boolean): Promise<void> {
  if (!isMappable.value) {
    return;
  }
  if (onMap) {
    await addToMap();
  } else {
    removeFromMap();
  }
}
</script>

<template>
  <div
    role="row"
    class="hover:bg-accent-50 dark:hover:bg-accent-800 col-span-full grid grid-cols-subgrid border-b border-accented last:border-b-0"
    :class="isOnMap ? 'text-highlighted' : 'text-toned'"
  >
    <div role="cell" class="flex min-w-0 items-start px-2 py-4">
      <DatasetNotMappableHint :is-mappable="isMappable">
        <UTooltip
          :disabled="!isMappable"
          :text="isOnMap ? t('dataset.removeFromMap') : t('dataset.addToMap')"
        >
          <USwitch
            data-testid="catalog-layer-on-map"
            size="xs"
            color="accent"
            checked-icon="i-lucide-check"
            :aria-label="dataset.properties.shortTitle"
            :aria-disabled="!isMappable || undefined"
            :aria-describedby="isMappable ? undefined : hintId"
            :model-value="isOnMap"
            :ui="{
              base: 'aria-disabled:cursor-not-allowed aria-disabled:opacity-75',
            }"
            @update:model-value="setOnMap"
          />
        </UTooltip>
      </DatasetNotMappableHint>
      <span v-if="!isMappable" :id="hintId" class="sr-only">
        {{ t("dataset.notMappable") }}
      </span>
      <ULink
        data-testid="catalog-layer-title"
        :title="dataset.properties.title"
        raw
        as="div"
        :to="titlePath"
        class="ms-4 min-w-0 text-sm"
      >
        <div class="flex min-w-0 items-center gap-space-xs">
          <p class="font-bold max-md:line-clamp-2 md:truncate">
            {{ dataset.properties.shortTitle }}
          </p>
          <UBadge
            v-if="dataset.properties.aggregated"
            color="neutral"
            variant="subtle"
            size="sm"
            :label="t('dataset.aggregated')"
            class="shrink-0"
            data-testid="catalog-layer-aggregated"
          />
        </div>
        <!-- Replaces the data owner column on mobile -->
        <p
          v-if="ownerName"
          data-testid="catalog-layer-owner"
          class="line-clamp-2 font-medium md:hidden"
        >
          {{ ownerName }}
        </p>
      </ULink>
    </div>
    <div
      role="cell"
      class="hidden truncate px-2 py-4 font-medium md:block"
      :title="ownerName"
    >
      {{ ownerName }}
    </div>
    <div role="cell" class="py-4 pr-2">
      <UButton
        data-testid="catalog-layer-info"
        icon="i-lucide-info"
        variant="link"
        color="accent"
        class="flex cursor-pointer p-0"
        :title="t('layers.info')"
        :aria-label="t('layers.info')"
        :to="detailPath"
      />
    </div>
  </div>
</template>
