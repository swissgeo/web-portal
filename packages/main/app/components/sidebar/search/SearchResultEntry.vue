<script setup lang="ts">
// Adapted from web-mapviewer SearchResultListEntry.vue

import type { SearchResult } from "@swissgeo/search";

import { SearchResultTypesEnum } from "@swissgeo/search";
import { ref } from "vue";

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
    class="border-surface-100 hover:bg-surface-50 focus:bg-surface-100 flex cursor-pointer items-start gap-3 border-b px-4 py-3 transition-colors focus:outline-none"
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
    <div class="text-surface-400 mt-1 flex-shrink-0">
      <UIcon
        v-if="entry.resultType === SearchResultTypesEnum.location"
        :data-testid="`icon-${entry.resultType.toLowerCase()}`"
        name="i-lucide-map-pin"
        class="size-10"
      />
      <UIcon
        v-else-if="entry.resultType === SearchResultTypesEnum.layer"
        name="i-lucide-layers"
        :data-testid="`icon-${entry.resultType.toLowerCase()}`"
        class="size-10"
      />
      <UIcon
        v-else-if="entry.resultType === SearchResultTypesEnum.feature"
        name="i-lucide-map-pinned"
        :data-testid="`icon-${entry.resultType.toLowerCase()}`"
        class="size-10"
      />
      <!--IF we are here, something is very wrong, but at least we'll know it-->
      <UIcon
        v-else
        :data-testid="`icon-${entry.resultType}`"
        name="i-lucide-bug"
        class="size-10"
      />
    </div>

    <!-- Title and description -->
    <div class="min-w-0 flex-1">
      <!-- Title with HTML support for search highlighting -->
      <div class="text-surface-900 font-medium" v-html="entry.title" />

      <!-- Description (optional) -->
      <div
        v-if="entry.description"
        class="text-surface-600 mt-1 truncate text-sm"
      >
        {{ entry.description }}
      </div>
    </div>
  </li>
</template>
