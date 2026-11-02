<script lang="ts" setup>
import type { Dataset } from "@swissgeo/ogc";

import { useI18n } from "vue-i18n";

import LayerCatalogOwner from "./LayerCatalogOwner.vue";

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
const owner = computed(() => dataset.properties.owner);

async function setOnMap(onMap: boolean): Promise<void> {
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
    <div
      role="cell"
      class="flex min-w-0 items-start px-2 py-4"
      :title="dataset.properties.title"
    >
      <USwitch
        data-testid="catalog-layer-on-map"
        size="xs"
        color="accent"
        checked-icon="i-lucide-check"
        :aria-label="dataset.properties.title"
        :model-value="isOnMap"
        @update:model-value="setOnMap"
      />
      <ULink
        data-testid="catalog-layer-title"
        raw
        as="div"
        :to="titlePath"
        class="ms-4 min-w-0 text-sm"
      >
        <div class="flex min-w-0 items-center gap-space-xs">
          <p class="font-bold max-md:line-clamp-2 md:truncate">
            {{ dataset.properties.title }}
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
          v-if="owner"
          data-testid="catalog-layer-provider"
          class="line-clamp-2 font-medium md:hidden"
        >
          <LayerCatalogOwner :owner />
        </p>
      </ULink>
    </div>
    <div role="cell" class="hidden px-2 py-4 font-medium md:block">
      <LayerCatalogOwner v-if="owner" :owner />
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
