<script setup lang="ts">
import type { SearchResult } from "@swissgeo/search";

import { useSearchStore } from "@swissgeo/skeleton";
import { useDebounceFn } from "@vueuse/core";
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useSearchSelection } from "@/composables/useSearchSelection";

import SearchCategory from "./SearchCategory.vue";

const { t, locale } = useI18n();
const searchStore = useSearchStore();
const toaster = useToaster();
const { handleResultSelection } = useSearchSelection();

const isOpen = defineModel<boolean>("open", { default: false });

const resultsRef = ref<HTMLElement | null>(null);
const activeTab = ref("map");

const query = computed({
  get: () => searchStore.query,
  set: (value: string) => {
    void debouncedSearch(value);
  },
});

const locationResults = computed(() =>
  searchStore.results.filter((r) => r.resultType === "LOCATION"),
);

const layerResults = computed(() =>
  searchStore.results.filter((r) => r.resultType === "LAYER"),
);

const featureResults = computed(() =>
  searchStore.results.filter((r) => r.resultType === "FEATURE"),
);

const karteResults = computed(() => [
  { id: "locations", results: locationResults.value },
  { id: "features", results: featureResults.value },
  { id: "layers", results: layerResults.value },
]);

const tabs = computed(() => [
  {
    label: t("search.map_tab"),
    badge: searchStore.mapResults.length || undefined,
    slot: "map" as const,
    value: "map",
  },
  {
    label: t("search.content_pages_tab"),
    badge: searchStore.contentResults.length || undefined,
    slot: "contentPages" as const,
    value: "content",
  },
]);

const debouncedSearch = useDebounceFn((value: string) => {
  void searchStore.setSearchQuery(value, locale.value);
}, 100);

// every source searches in one language, so a locale change leaves the results
// of the previous one behind until the query is run again. Only while there are
// results: the field also holds the name of an already selected result, and
// searching that again would pop the panel back up.
watch(locale, (value) => {
  if (searchStore.hasResults && searchStore.query.length >= 2) {
    void searchStore.setSearchQuery(searchStore.query, value);
  }
});

// a coordinate needs no confirmation: the map goes there as soon as the query
// is recognized as one, there is no entry to select
watch(
  () => searchStore.coordinateResult,
  (result) => {
    if (result) {
      void handleResultSelection(result);
    }
  },
);

watch(
  () => searchStore.hasResults,
  (hasResults) => {
    if (hasResults && query.value.length >= 2) {
      openResults();
    }
  },
);

watch(
  () => searchStore.hasError,
  (hasError) => {
    if (hasError) {
      toaster.showError(t("search.error"));
    }
  },
);

function handleSelect(result: SearchResult) {
  void handleResultSelection(result);
  // a layer leaves nothing on the map for the field to stand for, unlike a
  // place whose pin the field's clear button removes
  if (result.resultType === "LAYER") {
    searchStore.clearSearch();
  } else {
    // a title made of nothing but markup sanitizes to an empty string, which
    // would empty the field and take its clear button away with it
    searchStore.keepSelectedQuery(result.sanitizedTitle || searchStore.query);
  }
  isOpen.value = false;
}

// the map tab is the default one, and would claim there is nothing when the
// hits are all CMS pages
function openResults() {
  if (!searchStore.hasMapResults && searchStore.contentResults.length > 0) {
    activeTab.value = "content";
  }
  isOpen.value = true;
}

function handleClick() {
  if (query.value.length >= 2 && searchStore.hasResults) {
    openResults();
  }
}

// only the map tab holds the focusable list, the CMS results have their own tab
function focusFirstResult() {
  if (!searchStore.hasMapResults) {
    return;
  }
  activeTab.value = "map";
  isOpen.value = true;
  void nextTick(() => {
    resultsRef.value?.querySelector<HTMLElement>("li")?.focus();
  });
}

// clearing the field removes the marker of the selected result: selecting
// another one moves it, but nothing else would ever take it off the map
function clearSearch() {
  searchStore.clearSearch();
  searchStore.clearPinnedCoordinate();
  isOpen.value = false;
}
</script>

<template>
  <UPopover
    v-model:open="isOpen"
    :content="{
      align: 'start',
      sideOffset: 8,
      // the results open while the user is still typing, so the focus has to
      // stay in the input, arrow down is what moves it to the results
      onOpenAutoFocus: (event: Event) => event.preventDefault(),
    }"
    :dismissible="true"
    :ui="{ content: 'w-(--reka-popper-anchor-width) min-w-96' }"
  >
    <template #anchor>
      <UInput
        ref="inputRef"
        v-model="query"
        icon="i-lucide-search"
        :placeholder="t('search.placeholder')"
        :loading="searchStore.isSearching"
        size="md"
        variant="outline"
        color="secondary"
        class="w-72 grow"
        data-testid="topbar-search-input"
        @click="handleClick"
        @keydown.down.prevent="focusFirstResult"
      >
        <template v-if="query" #trailing>
          <UButton
            icon="i-lucide-circle-x"
            color="primary"
            variant="ghost"
            size="xs"
            aria-label="Clear search"
            @click="clearSearch"
          />
        </template>
      </UInput>
    </template>

    <template #content>
      <UTabs v-model="activeTab" :items="tabs" size="sm">
        <template #map>
          <div
            v-if="searchStore.hasMapResults"
            ref="resultsRef"
            class="max-h-96 overflow-y-auto"
            data-testid="search-results"
          >
            <SearchCategory
              v-for="category in karteResults"
              v-show="category.results.length > 0"
              :key="category.id"
              :title="t(`search.${category.id}_results_header`)"
              :results="category.results"
              @select="handleSelect"
            />
          </div>
          <div
            v-else-if="
              !searchStore.hasMapResults &&
              searchStore.query.length >= 2 &&
              !searchStore.isSearching
            "
            class="text-surface-500 p-4 text-center"
          >
            {{ t("search.no_results") }}
          </div>
          <div v-else class="text-surface-500 p-4">
            {{ t("search.placeholder") }}
          </div>
        </template>

        <template #contentPages>
          <!-- No category header here: the tab label already names it. -->
          <SearchCategory
            v-if="searchStore.contentResults.length > 0"
            class="max-h-96 overflow-y-auto"
            data-testid="content-search-results"
            :results="searchStore.contentResults"
            @select="handleSelect"
          />
          <div
            v-else-if="
              searchStore.contentResults.length === 0 &&
              searchStore.query.length >= 2 &&
              !searchStore.isSearching
            "
            class="text-surface-500 p-4 text-center"
          >
            {{ t("search.no_results") }}
          </div>
          <div v-else class="text-surface-500 p-4">
            {{ t("search.placeholder") }}
          </div>
        </template>
      </UTabs>
    </template>
  </UPopover>
</template>
