<script lang="ts" setup>
import type { Dataset } from "@swissgeo/ogc";

import { refDebounced, useInfiniteScroll } from "@vueuse/core";
import { useI18n } from "vue-i18n";

import LayerCatalogRow from "./LayerCatalogRow.vue";

const { t, locale } = useI18n();

const searchInputId = useId();
const query = ref("");
const debouncedQuery = refDebounced(query, 100);

const { state, hasMore, loadMore, retry } = useOgcCatalog(
  locale,
  debouncedQuery,
);

const datasets = computed<Dataset[]>(() => state.value.data?.features ?? []);

const scroller = usePanelScroller();

useInfiniteScroll(scroller, loadMore, {
  distance: 200,
  canLoadMore: () => hasMore.value && state.value.status !== "error",
});
</script>

<template>
  <div class="min-w-0 flex-1 p-4">
    <div
      role="table"
      class="grid grid-cols-[minmax(0,1fr)_--spacing(9)] overflow-hidden rounded-md border border-accented bg-default text-sm leading-small-text md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_--spacing(9)]"
    >
      <div
        role="row"
        class="col-span-full hidden grid-cols-subgrid border-b border-accented font-bold text-highlighted md:grid"
      >
        <div role="columnheader" class="flex h-12 items-center px-3">
          {{ t("layerCatalog.table.title") }}
        </div>
        <div
          role="columnheader"
          aria-colspan="2"
          class="col-span-2 flex h-12 items-center px-2"
        >
          {{ t("layerCatalog.table.dataOwner") }}
        </div>
      </div>
      <div role="row" class="col-span-full border-b border-accented">
        <div role="cell" class="p-3">
          <label :for="searchInputId" class="sr-only">
            {{ t("layerCatalog.searchLabel") }}
          </label>
          <UInput
            :id="searchInputId"
            v-model="query"
            icon="i-lucide-search"
            :placeholder="t('layerCatalog.searchPlaceholder')"
            variant="outline"
            class="w-full"
          >
            <template v-if="query" #trailing>
              <UButton
                icon="i-lucide-circle-x"
                color="primary"
                variant="ghost"
                size="xs"
                aria-label="Clear search"
                @click="query = ''"
              />
            </template>
          </UInput>
        </div>
      </div>
      <div role="rowgroup" class="col-span-full grid grid-cols-subgrid">
        <LayerCatalogRow
          v-for="dataset in datasets"
          :key="dataset.id"
          :dataset
        />
        <div v-if="state.status === 'pending'" role="row" class="col-span-full">
          <div role="cell" class="px-3 py-4 text-muted">
            {{ t("layerCatalog.loading") }}
          </div>
        </div>
        <div
          v-else-if="state.status === 'error'"
          role="row"
          class="col-span-full"
        >
          <div role="cell" class="flex items-center gap-3 px-3 py-4">
            <span class="text-error">{{ t("layerCatalog.error") }}</span>
            <UButton
              color="primary"
              variant="outline"
              size="xs"
              class="cursor-pointer"
              @click="retry"
            >
              {{ t("layerCatalog.retry") }}
            </UButton>
          </div>
        </div>
        <div v-else-if="datasets.length === 0" role="row" class="col-span-full">
          <div role="cell" class="px-3 py-4 text-muted">
            {{ t("layerCatalog.table.empty") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
