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

const activeTab = ref("map");

// the input given by the user is available through the input's `inputRef` member
const searchInputRef = ref<{ inputRef: HTMLInputElement | null } | null>(null);

const categoryRefs = new Map<string, InstanceType<typeof SearchCategory>>();

function setCategoryRef(id: string, element: unknown) {
  if (element) {
    categoryRefs.set(id, element as InstanceType<typeof SearchCategory>);
  } else {
    categoryRefs.delete(id); // called with null on unmount
  }
}

const query = computed({
  get: () => searchStore.query,
  set: (value: string) => {
    void debouncedSearch(value);
  },
});

// v-for and v-ifs are not playing nicely together, so we do the filter here.
const searchResultsByCategory = computed(() =>
  [
    {
      id: "locations" as const,
      results: searchStore.locationResults,
    },
    {
      id: "layers" as const,
      results: searchStore.layerResults,
    },
    {
      id: "features" as const,
      results: searchStore.featureResults,
    },
  ].filter((category) => category.results?.length > 0),
);

const tabStartCategory = computed(() => {
  return searchResultsByCategory.value[0]?.id ?? null;
});
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

function closeResults() {
  isOpen.value = false;
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
    categoryRefs.get(searchResultsByCategory.value[0]!.id)?.focusFirstEntry();
  });
}

function onFirstEntryReached(currentCategoryId: string) {
  const categories = searchResultsByCategory.value;
  const categoryIndex = categories.findIndex(
    (category) => category.id === currentCategoryId,
  );
  if (categoryIndex <= 0) {
    focusInput();
  } else {
    categoryRefs.get(categories[categoryIndex - 1]!.id)?.focusLastEntry();
  }
}

function onLastEntryReached(currentCategoryId: string) {
  const categories = searchResultsByCategory.value;
  const nextCategory =
    categories[
      categories.findIndex((category) => category.id === currentCategoryId) + 1
    ];
  if (nextCategory) {
    categoryRefs.get(nextCategory.id)?.focusFirstEntry();
  }
}

function focusInput() {
  searchInputRef.value?.inputRef?.focus();
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
    :ui="{ content: 'w-(--reka-popper-anchor-width) min-w-96 max-sm:min-w-0' }"
  >
    <template #anchor>
      <UInput
        ref="searchInputRef"
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
            class="flex h-[60dvh] flex-col sm:h-96"
            data-testid="search-results"
          >
            <SearchCategory
              v-for="category in searchResultsByCategory"
              :key="category.id"
              :ref="(element) => setCategoryRef(category.id, element)"
              class="min-h-0 flex-1"
              :title="t(`search.${category.id}_results_header`)"
              :results="category.results"
              :tab-start="tabStartCategory === category.id"
              :data-testid="`search-category-${category.id}`"
              @select="handleSelect"
              @view-details="closeResults"
              @first-entry-reached="onFirstEntryReached(category.id)"
              @last-entry-reached="onLastEntryReached(category.id)"
            />
          </div>
          <div
            v-else-if="
              !searchStore.hasMapResults &&
              searchStore.query.length >= 2 &&
              !searchStore.isSearching
            "
            class="p-4 text-center text-muted"
          >
            {{ t("search.no_results") }}
          </div>
          <div v-else class="p-4 text-muted">
            {{ t("search.placeholder") }}
          </div>
        </template>

        <template #contentPages>
          <!-- No category header here: the tab label already names it. -->
          <SearchCategory
            v-if="searchStore.contentResults.length > 0"
            :tab-start="true"
            class="max-h-96"
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
            class="p-4 text-center text-muted"
          >
            {{ t("search.no_results") }}
          </div>
          <div v-else class="p-4 text-muted">
            {{ t("search.placeholder") }}
          </div>
        </template>
      </UTabs>
    </template>
  </UPopover>
</template>
