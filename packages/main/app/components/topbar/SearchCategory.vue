<script setup lang="ts">
// Adapted from web-mapviewer SearchResultCategory.vue

import type { SearchResult } from "@swissgeo/search";

import { ref } from "vue";

import SearchResultEntry from "./SearchResultEntry.vue";

defineProps<{
  /** Left out where the surrounding tab already names the category */
  title?: string;
  results: SearchResult[];
  tabStart: boolean;
}>();

const emit = defineEmits<{
  select: [result: SearchResult];
  viewDetails: [];
  firstEntryReached: [];
  lastEntryReached: [];
}>();

const entries = ref<InstanceType<typeof SearchResultEntry>[]>([]);

// Focus management for keyboard navigation
function focusFirstEntry() {
  if (entries.value && entries.value.length > 0) {
    entries.value[0]?.goToFirst();
  }
}

function focusLastEntry() {
  if (entries.value && entries.value.length > 0) {
    entries.value[entries.value.length - 1]?.goToLast();
  }
}

// Expose methods for parent to call
defineExpose({
  focusFirstEntry,
  focusLastEntry,
});
</script>

<template>
  <div class="flex flex-col gap-2 border-default px-2 not-first:border-t">
    <!-- Category header -->
    <h3
      v-if="title"
      data-testid="category-title"
      class="mt-3 ml-2 shrink-0 border-b border-default pb-2 text-sm leading-small-text font-bold text-highlighted"
    >
      {{ title }}
    </h3>

    <!-- Results list -->
    <UScrollArea class="min-h-0 flex-1">
      <ul class="flex list-none flex-col gap-0.5 pb-2" tabindex="-1">
        <SearchResultEntry
          v-for="(entry, index) in results"
          :key="entry.id"
          ref="entries"
          :index="index"
          :entry="entry"
          :tab-start="tabStart && index === 0"
          @select="emit('select', entry)"
          @view-details="emit('viewDetails')"
          @first-entry-reached="emit('firstEntryReached')"
          @last-entry-reached="emit('lastEntryReached')"
        />
      </ul>
    </UScrollArea>
  </div>
</template>
