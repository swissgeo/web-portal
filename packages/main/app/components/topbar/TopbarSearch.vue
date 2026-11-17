<script setup lang="ts">
import type { SearchResult } from "@swissgeo/search";

import { useSearchStore } from "@swissgeo/skeleton";
import { createReusableTemplate, refDebounced } from "@vueuse/core";
import {
  computed,
  nextTick,
  onActivated,
  onDeactivated,
  ref,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";

import { useSearchSelection } from "@/composables/useSearchSelection";

import SearchCategory from "./SearchCategory.vue";

const emit = defineEmits(["selected", "coordinates-detected"]);
const { skipMobile = false } = defineProps<{
  skipMobile?: boolean;
}>();

const { t, locale } = useI18n();
const searchStore = useSearchStore();
const toaster = useToaster();
const { handleResultSelection } = useSearchSelection();

// the popover under the field: open while there are results to show
const isPopoverOpen = defineModel<boolean>("open", { default: false });
// below lg the field gives way to a button opening a full-screen search: open
// from the tap on the button until it is closed or a result is selected
const isModalOpen = ref(false);
const mobileInputRef = ref<{ inputRef: HTMLInputElement | null } | null>(null);

// the same results show in the desktop popover and in the full-screen search
const [DefineResults, ReuseResults] = createReusableTemplate<{
  fill?: boolean;
}>();

// The page keeps this component mounted while another one is shown: its
// watchers must not act on the store then, or two panels would open for one
// search.
let isActive = true;

onDeactivated(() => {
  isActive = false;
  isPopoverOpen.value = false;
  isModalOpen.value = false;
});

onActivated(() => {
  isActive = true;
});

const enableCmsSearch = searchStore.enableCmsSearch;

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

// the field keeps its own text: bound to the store query, which only follows
// after the debounce, a render in between would put the older query back
const query = ref(searchStore.query);
const debouncedQuery = refDebounced(query, 100);

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

const tabs = computed(() => {
  const items: {
    label: string;
    badge: number | undefined;
    slot: "map" | "contentPages";
    value: string;
  }[] = [
    {
      label: t("search.map_tab"),
      badge: searchStore.mapResults.length || undefined,
      slot: "map",
      value: "map",
    },
  ];

  if (enableCmsSearch) {
    items.push({
      label: t("search.content_pages_tab"),
      badge: searchStore.contentResults.length || undefined,
      slot: "contentPages",
      value: "content",
    });
  }

  return items;
});

// clear and selection write the store as well, so the text they put in the
// field arrives here equal to the store query and starts no search
watch(debouncedQuery, async (value) => {
  if (!isActive || value === searchStore.query) {
    return;
  }
  await searchStore.setSearchQuery(value, locale.value);
  // the results watcher only opens on hits: a pasted text that finds nothing
  // would otherwise never show that there is nothing
  if (
    isActive &&
    searchStore.query === value &&
    value.trim().length >= 2 &&
    !searchStore.isSearching &&
    !searchStore.hasError &&
    !searchStore.coordinateResult
  ) {
    openResults();
  }
});

// every source searches in one language, so a locale change leaves the results
// of the previous one behind until the query is run again. Only while there are
// results: the field also holds the name of an already selected result, and
// searching that again would pop the panel back up.
watch(locale, (value) => {
  if (!isActive) {
    return;
  }
  if (searchStore.hasResults && searchStore.query.length >= 2) {
    void searchStore.setSearchQuery(searchStore.query, value);
  }
});

// a coordinate needs no confirmation: the map goes there as soon as the query
// is recognized as one, there is no entry to select
watch(
  () => searchStore.coordinateResult,
  (result) => {
    if (!isActive) {
      return;
    }
    if (result) {
      emit("coordinates-detected", result);
      void handleResultSelection(result);
    }
  },
);

watch(
  () => searchStore.hasResults,
  (hasResults) => {
    if (!isActive) {
      return;
    }
    if (hasResults && searchStore.query.length >= 2) {
      openResults();
    }
  },
);

watch(
  () => searchStore.hasError,
  (hasError) => {
    if (!isActive) {
      return;
    }
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
    query.value = "";
    searchStore.clearSearch();
  } else {
    // a title made of nothing but markup sanitizes to an empty string, which
    // would empty the field and take its clear button away with it
    const title = result.sanitizedTitle || searchStore.query;
    query.value = title;
    searchStore.keepSelectedQuery(title);
  }
  isPopoverOpen.value = false;
  // unmounting the field closes the phone keyboard and uncovers the map
  isModalOpen.value = false;
  emit("selected");
}

// the map tab is the default one, and would claim there is nothing when the
// hits are all CMS pages
function openResults() {
  if (
    enableCmsSearch &&
    !searchStore.hasMapResults &&
    searchStore.contentResults.length > 0
  ) {
    activeTab.value = "content";
  }
  // the full-screen search shows the results itself, the popover would open
  // on top of it, anchored to the hidden desktop field
  isPopoverOpen.value = !isModalOpen.value;
}

// the keyboard has to come up with the search, not on the close button
function focusMobileInput(event: Event) {
  event.preventDefault();
  mobileInputRef.value?.inputRef?.focus();
}

function closeResults() {
  isPopoverOpen.value = false;
  isModalOpen.value = false;
}

function handleClick() {
  if (searchStore.query.length >= 2 && searchStore.hasResults) {
    openResults();
  }
}

// Enter applies the field content right away: the debounced watcher would
// otherwise still search the previous query, and the field keeps a previous
// coordinate search until it is submitted again
function submitCoordinate() {
  void searchStore.setSearchQuery(query.value, locale.value);
}

// only the map tab holds the focusable list, the CMS results have their own tab
function focusFirstResult() {
  if (!searchStore.hasMapResults) {
    return;
  }
  activeTab.value = "map";
  isPopoverOpen.value = true;
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
  query.value = "";
  searchStore.clearSearch();
  searchStore.clearPinnedCoordinate();
  isPopoverOpen.value = false;
}
</script>

<template>
  <DefineResults v-slot="{ fill }">
    <UTabs
      v-model="activeTab"
      :items="tabs"
      size="sm"
      :class="{ 'min-h-0 flex-1': fill }"
      :ui="{
        list: tabs.length === 1 ? 'hidden' : '',
        content: fill ? 'min-h-0 flex-1' : undefined,
      }"
    >
      <template #map>
        <div
          v-if="searchStore.hasMapResults"
          class="flex flex-col"
          :class="fill ? 'h-full' : 'h-100 max-h-[60dvh]'"
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
        <!-- the full-screen search keeps the hint in its field -->
        <div v-else-if="!fill" class="p-4 text-muted">
          {{ t("search.placeholder") }}
        </div>
      </template>

      <template #contentPages>
        <template v-if="enableCmsSearch">
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
          <div v-else-if="!fill" class="p-4 text-muted">
            {{ t("search.placeholder") }}
          </div>
        </template>
      </template>
    </UTabs>
  </DefineResults>

  <UPopover
    v-model:open="isPopoverOpen"
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
        size="xl"
        variant="outline"
        color="primary"
        class="w-119.25 min-w-0 grow lg:block"
        :class="{
          hidden: !skipMobile,
        }"
        data-testid="topbar-search-input"
        @click="handleClick"
        @keydown.down.prevent="focusFirstResult"
        @keydown.enter.prevent="submitCoordinate"
        :ui="{
          // the placeholder disappears as soon as the field is clicked into
          base: 'placeholder-nav-brand-muted! ring-0 focus:placeholder-transparent! text-ellipsis dark:bg-primary-950',
          leadingIcon: 'text-nav-brand-muted',
        }"
        v-bind="$attrs"
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
      <UModal
        v-model:open="isModalOpen"
        fullscreen
        :title="t('menu.search')"
        :close="{ ui: { leadingIcon: 'size-5 text-accent' } }"
        :content="{ onOpenAutoFocus: focusMobileInput }"
        :ui="{
          content: 'divide-y-0',
          header: 'min-h-0 p-4 sm:px-4',
          title: 'text-lg leading-normal',
          close: 'top-4 end-3',
          body: 'flex min-h-0 flex-col p-0 sm:p-0',
        }"
      >
        <UButton
          v-show="!skipMobile"
          icon="i-lucide-search"
          variant="ghost"
          class="lg:hidden"
          :aria-label="t('search.buttonLabel')"
          :ui="{ leadingIcon: 'text-nav-brand' }"
          data-testid="mobile-search-button"
        />

        <template #body>
          <div
            class="px-4 pb-4"
            :class="{ 'border-b border-default': !searchStore.hasMapResults }"
          >
            <UInput
              ref="mobileInputRef"
              v-model="query"
              icon="i-lucide-search"
              :placeholder="t('search.placeholder')"
              :loading="searchStore.isSearching"
              size="xl"
              variant="soft"
              color="neutral"
              class="w-full"
              data-testid="mobile-search-input"
              :ui="{
                // the focus outline sits outside the field, where the
                // scrolling body cuts it off; the field always has the focus
                base: 'bg-elevated font-medium text-ellipsis focus-visible:outline-none',
                leadingIcon: 'text-highlighted',
              }"
              @keydown.enter.prevent="submitCoordinate"
            >
              <template v-if="query" #trailing>
                <UButton
                  icon="i-lucide-circle-x"
                  color="neutral"
                  variant="link"
                  aria-label="Clear search"
                  :ui="{ leadingIcon: 'size-6 text-accent' }"
                  @click="clearSearch"
                />
              </template>
            </UInput>
          </div>
          <div class="flex min-h-0 flex-1 flex-col px-2 pb-2">
            <!-- a bare `fill` would arrive as "", the template takes no props -->
            <ReuseResults :fill="true" />
          </div>
        </template>
      </UModal>
    </template>

    <template #content>
      <ReuseResults />
    </template>
  </UPopover>
</template>
