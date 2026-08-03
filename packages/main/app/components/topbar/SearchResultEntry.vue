<script setup lang="ts">
// Adapted from web-mapviewer SearchResultListEntry.vue

import type { SearchResult } from "@swissgeo/search";

import { SearchResultTypesEnum } from "@swissgeo/search";
import { useDatasetPanelStore } from "@swissgeo/skeleton";
import { ref } from "vue";

const datasetPanelStore = useDatasetPanelStore();

const { index, entry } = defineProps<{
  index: number;
  entry: SearchResult;
}>();

const emit = defineEmits<{
  select: [];
  firstEntryReached: [];
  lastEntryReached: [];
}>();

const item = ref<HTMLLIElement>();

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
  emit("select");
}

defineExpose({
  // Expose methods for parent to call
  goToFirst,
  goToLast,
});
</script>

<template>
  <!-- List item with keyboard navigation -->
  <li
    ref="item"
    class="hover:bg-surface-50 focus:bg-surface-100 flex cursor-pointer items-center gap-2 px-3 py-2 transition-colors focus:outline-none"
    :data-testid="`search-result-entry-${entry.resultType.toLowerCase()}-${index}`"
    :tabindex="index === 0 ? 0 : -1"
    @keydown.up.prevent="goToPrevious"
    @keydown.down.prevent="goToNext"
    @keydown.home.prevent="goToFirst"
    @keydown.end.prevent="goToLast"
    @keyup.enter="selectItem"
    @click="selectItem"
  >
    <!-- Icon based on result type -->
    <UIcon
      v-if="entry.resultType === SearchResultTypesEnum.location"
      :data-testid="`icon-${entry.resultType.toLowerCase()}`"
      name="i-lucide-map-pin"
    />
    <UIcon
      v-else-if="entry.resultType === SearchResultTypesEnum.layer"
      :data-testid="`icon-${entry.resultType.toLowerCase()}`"
      name="i-lucide-layers"
    />
    <UIcon
      v-else-if="entry.resultType === SearchResultTypesEnum.feature"
      :data-testid="`icon-${entry.resultType.toLowerCase()}`"
      name="i-lucide-map-pinned"
    />
    <UIcon
      v-else
      :data-testid="`icon-${entry.resultType}`"
      name="i-lucide-bug"
    />

    <!-- Title -->
    <div class="min-w-0 flex-1 truncate" v-html="entry.title" />

    <!-- Layer results info button -->
    <UButton
      v-if="entry.resultType === SearchResultTypesEnum.layer"
      :data-testid="`search-result-info-${index}`"
      :aria-label="$t('search.viewDataset')"
      :title="$t('search.viewDataset')"
      icon="i-lucide-info"
      color="neutral"
      variant="ghost"
      size="sm"
      @click.stop="datasetPanelStore.openDatasetPanel(entry.id)"
    />
  </li>
</template>
