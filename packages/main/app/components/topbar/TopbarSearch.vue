<script setup lang="ts">
import type { SearchResult } from "@swissgeo/search";

import { useSearchStore } from "@swissgeo/skeleton";
import { useDebounceFn } from "@vueuse/core";
import { computed, watch } from "vue";
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

function clearSearch() {
  searchStore.clearSearch();
  isOpen.value = false;
}
</script>

<template>
  <UPopover
    v-model:open="isOpen"
    :content="{ align: 'start', sideOffset: 8 }"
    :dismissible="true"
    :ui="{ content: 'w-96' }"
  >
    <template #anchor>
      <UInput
        ref="inputRef"
        v-model="query"
        icon="i-lucide-search"
        :placeholder="t('search.placeholder')"
        :loading="searchStore.isSearching"
        size="xl"
        variant="soft"
        color="neutral"
        class="w-full xl:w-[280px] 2xl:w-[472px]"
        :ui="{
          base: 'bg-elevated hover:bg-accented focus:bg-accented',
          leadingIcon: 'text-muted',
        }"
        data-testid="topbar-search-input"
        @click="handleClick"
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
            class="p-4 text-center text-muted"
          >
            {{ t("search.no_results") }}
          </div>
          <div v-else class="p-4 text-muted">
            {{ t("search.placeholder") }}
          </div>
        </template>

        <template #contentPages>
          <div class="p-4 text-center text-muted">
            {{ t("search.no_results") }}
          </div>
        </template>
      </UTabs>
    </template>
  </UPopover>
</template>
