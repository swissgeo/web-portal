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
  <!-- Category container -->
  <UScrollArea>
    <!-- Category header -->
    <div
      v-if="title"
      class="sticky top-0 z-10 border-b border-default bg-default px-4 py-2 text-sm font-semibold text-muted"
    >
      {{ title }}
    </div>

    <!-- Results list -->
    <ul class="list-none" tabindex="-1">
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
</template>
