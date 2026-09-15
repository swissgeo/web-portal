<script lang="ts" setup>
import type { Dataset } from "@swissgeo/ogc";

import { useInfiniteScroll } from "@vueuse/core";
import { useI18n } from "vue-i18n";

import LayerCatalogRow from "./LayerCatalogRow.vue";

const { t, locale } = useI18n();

const query = ref("");

const { state, hasMore, loadMore, retry } = useOgcCatalog(locale, query);

const datasets = computed<Dataset[]>(() => state.value.data?.features ?? []);

const scroller = useTemplateRef("scroller");

useInfiniteScroll(scroller, loadMore, {
  distance: 200,
  canLoadMore: () => hasMore.value && state.value.status !== "error",
});
</script>

<template>
  <div ref="scroller" class="min-w-0 flex-1 overflow-y-auto p-4">
    <div class="overflow-hidden rounded-md border border-accented bg-default">
      <table class="w-full table-fixed text-left text-sm leading-small-text">
        <colgroup>
          <col />
          <col />
          <col class="w-9" />
        </colgroup>
        <thead>
          <tr class="border-b border-accented">
            <th class="h-12 px-3 font-bold text-highlighted">
              {{ t("layerCatalog.table.title") }}
            </th>
            <th colspan="2" class="h-12 px-2 font-bold text-highlighted">
              {{ t("layerCatalog.table.dataOwner") }}
            </th>
          </tr>
          <tr class="border-b border-accented">
            <td colspan="3" class="p-3">
              <UInput
                v-model="query"
                icon="i-lucide-search"
                :placeholder="t('layerCatalog.searchPlaceholder')"
                variant="outline"
                class="w-full"
                data-testid="catalog-search-input"
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
            </td>
          </tr>
        </thead>
        <tbody>
          <LayerCatalogRow
            v-for="dataset in datasets"
            :key="dataset.id"
            :dataset
          />
          <tr v-if="state.status === 'pending'">
            <td colspan="3" class="px-3 py-4 text-muted">
              {{ t("layerCatalog.loading") }}
            </td>
          </tr>
          <tr v-else-if="state.status === 'error'">
            <td colspan="3" class="px-3 py-4">
              <div class="flex items-center gap-3">
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
            </td>
          </tr>
          <tr v-else-if="datasets.length === 0">
            <td colspan="3" class="px-3 py-4 text-muted">
              {{ t("layerCatalog.table.empty") }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
