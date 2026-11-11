<script setup lang="ts">
// Adapted from web-mapviewer SearchResultListEntry.vue

import type { SearchResult } from "@swissgeo/search";

import { isLayerSearchResult, SearchResultTypesEnum } from "@swissgeo/search";
import { sanitizeHtml } from "@swissgeo/shared";
import { computed, ref, useId } from "vue";
import { useI18n } from "vue-i18n";

const localePath = useLocalePath();
const { t } = useI18n();

const {
  index,
  entry,
  tabStart = false,
} = defineProps<{
  index: number;
  entry: SearchResult;
  tabStart: boolean;
}>();

const emit = defineEmits<{
  select: [];
  viewDetails: [];
  firstEntryReached: [];
  lastEntryReached: [];
}>();

const item = ref<HTMLLIElement>();

const sanitizedTitle = computed(() => sanitizeHtml(entry.title));
const detailPath = computed(() => localePath(`/dataset/${entry.id}`));
// Only layer results go on the map, so only they can be not mappable
const isMappable = computed(
  () => !isLayerSearchResult(entry) || entry.isMappable,
);
const hintId = useId();

// What selecting the result does is not obvious from the landing page
const tooltip = computed(() => {
  if (isLayerSearchResult(entry)) {
    return entry.isMappable ? t("dataset.addToMap") : undefined;
  }
  if (entry.resultType === "LOCATION") {
    return t("search.jumpToLocation");
  }
  return undefined;
});

// Keyboard navigation
function goToFirst() {
  if (!item.value) {
    return;
  }
  const firstItem = item.value.parentElement
    ?.firstElementChild as HTMLLIElement;
  firstItem?.focus();
}

function goToPrevious() {
  if (!item.value) {
    return;
  }
  if (item.value.previousElementSibling) {
    (item.value.previousElementSibling as HTMLLIElement).focus();
  } else {
    emit("firstEntryReached");
  }
}

function goToNext() {
  if (!item.value) {
    return;
  }
  if (item.value.nextElementSibling) {
    (item.value.nextElementSibling as HTMLLIElement).focus();
  } else {
    emit("lastEntryReached");
  }
}

function goToLast() {
  if (!item.value?.parentElement) {
    return;
  }
  const lastItem = item.value.parentElement.lastElementChild as HTMLLIElement;
  lastItem?.focus();
}

// Selection handler
function selectItem() {
  if (isMappable.value) {
    emit("select");
  }
}

defineExpose({
  // Expose methods for parent to call
  goToFirst,
  goToLast,
});
</script>

<template>
  <!-- List item with keyboard navigation -->
  <DatasetNotMappableHint :show-hint="!isMappable" :tooltip="tooltip">
    <li
      ref="item"
      class="flex items-center gap-2 px-2 py-1 text-sm leading-small-text font-medium transition-colors focus:outline-none focus-visible:bg-elevated"
      :class="
        isMappable
          ? 'text-accent cursor-pointer hover:bg-muted focus-visible:text-highlighted'
          : 'cursor-not-allowed text-muted'
      "
      :aria-describedby="isMappable ? undefined : hintId"
      :data-testid="`search-result-entry-${entry.resultType.toLowerCase()}-${index}`"
      :tabindex="tabStart ? 0 : -1"
      @keydown.up.prevent="goToPrevious"
      @keydown.down.prevent="goToNext"
      @keydown.home.prevent="goToFirst"
      @keydown.end.prevent="goToLast"
      @keyup.enter="selectItem"
      @click="selectItem"
    >
      <!-- Title -->
      <ClientOnly>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="min-w-0 flex-1 truncate" v-html="sanitizedTitle" />
      </ClientOnly>

      <!-- Layer info button, the negative margins keep the row height -->
      <UButton
        class="-my-1 -mr-1"
        v-if="entry.resultType === SearchResultTypesEnum.layer"
        :data-testid="`search-result-info-${index}`"
        :aria-label="t('search.viewDataset')"
        :title="t('search.viewDataset')"
        icon="i-lucide-info"
        color="primary"
        variant="ghost"
        size="xs"
        :to="detailPath"
        @click.stop="emit('viewDetails')"
        @keyup.enter.stop
      />
      <span v-if="!isMappable" :id="hintId" class="sr-only">
        {{ t("dataset.notMappable") }}
      </span>
    </li>
  </DatasetNotMappableHint>
</template>
