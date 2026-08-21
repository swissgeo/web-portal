<script setup lang="ts">
import type { SearchResult } from "@swissgeo/search";

import { useSearchStore } from "@swissgeo/skeleton";
import { useDebounceFn } from "@vueuse/core";
import { computed, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";

import SearchCategory from "./SearchCategory.vue";

const { t, locale } = useI18n();
const searchStore = useSearchStore();
const toaster = useToaster();

const isOpen = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  "result-selected": [result: SearchResult];
}>();

const query = computed({
  get: () => searchStore.query,
  set: (value: string) => {
    void debouncedSearch(value);
  },
});

const tabs = computed(() => [
  {
    label: t("search.map_tab"),
    badge: searchStore.results.length || undefined,
    slot: "map" as const,
  },
  {
    label: t("search.content_pages_tab"),
    badge: 0,
    slot: "contentPages" as const,
  },
]);

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

const debouncedSearch = useDebounceFn((value: string) => {
  void searchStore.setSearchQuery(value, locale.value);
}, 100);

// a coordinate needs no confirmation: as in map.geo.admin.ch, the map goes
// there as soon as the query is recognized as one
watch(
  () => searchStore.coordinateResult,
  (result) => {
    if (result) {
      emit("result-selected", result);
    }
  },
);

watch(
  () => searchStore.hasResults,
  (hasResults) => {
    if (hasResults && query.value.length >= 2) {
      isOpen.value = true;
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
  emit("result-selected", result);
  searchStore.clearSearch();
  isOpen.value = false;
}

function handleClick() {
  if (query.value.length >= 2 && searchStore.hasResults) {
    isOpen.value = true;
  }
}

// the results are rendered in a portal, outside of this component, so they are
// reached through the DOM rather than through a template ref
function focusFirstResult() {
  if (!searchStore.hasResults) {
    return;
  }
  isOpen.value = true;
  void nextTick(() => {
    document
      .querySelector<HTMLElement>('[data-testid="search-results"] li')
      ?.focus();
  });
}

// the marker of a previously selected coordinate is only removed when the user
// explicitly clears the search, not when a result is selected
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
        class="min-w-72 flex-1"
        data-testid="topbar-search-input"
        @click="handleClick"
        @keydown.down.prevent="focusFirstResult"
      >
        <template v-if="query" #trailing>
          <UButton
            icon="i-lucide-circle-x"
            color="neutral"
            variant="link"
            size="sm"
            aria-label="Clear search"
            @click="clearSearch"
          />
        </template>
      </UInput>
    </template>

    <template #content>
      <UTabs :items="tabs" size="sm">
        <template #map>
          <div
            v-if="searchStore.hasResults"
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
              searchStore.query.length >= 2 && !searchStore.isSearching
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
          <div class="text-surface-500 p-4 text-center">
            {{ t("search.no_results") }}
          </div>
        </template>
      </UTabs>
    </template>
  </UPopover>
</template>
