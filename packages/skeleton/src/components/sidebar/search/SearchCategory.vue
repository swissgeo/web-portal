<script setup lang="ts">
// Adapted from web-mapviewer SearchResultCategory.vue
// Original: /home/ismailsunni/dev/c2c/web-mapviewer/packages/viewer/src/modules/menu/components/search/SearchResultCategory.vue

import { ref } from 'vue'
import type { SearchResult } from '@swissgeo/search'
import SearchResultEntry from './SearchResultEntry.vue'

defineProps<{
    title: string
    results: SearchResult[]
}>()

const emit = defineEmits<{
    select: [result: SearchResult]
    firstEntryReached: []
    lastEntryReached: []
}>()

const entries = ref<InstanceType<typeof SearchResultEntry>[]>([])

// Focus management for keyboard navigation (from mapviewer lines 34-44)
function focusFirstEntry() {
    if (entries.value && entries.value.length > 0) {
        entries.value[0]?.goToFirst()
    }
}

function focusLastEntry() {
    if (entries.value && entries.value.length > 0) {
        entries.value[entries.value.length - 1]?.goToLast()
    }
}

// Expose methods for parent to call (from mapviewer line 46)
defineExpose({
    focusFirstEntry,
    focusLastEntry,
})
</script>

<template>
    <!-- Category container (from mapviewer lines 50-73) -->
    <div class="search-category">
        <!-- Category header (from mapviewer lines 51-53) -->
        <div class="bg-surface-50 px-4 py-2 text-sm font-semibold text-surface-700">
            {{ title }}
        </div>

        <!-- Results list (from mapviewer lines 54-71) -->
        <ul class="list-none" tabindex="-1">
            <SearchResultEntry
                v-for="(entry, index) in results"
                :key="entry.id"
                ref="entries"
                :index="index"
                :entry="entry"
                data-cy="search-result-entry"
                @select="emit('select', entry)"
                @first-entry-reached="emit('firstEntryReached')"
                @last-entry-reached="emit('lastEntryReached')"
            />
        </ul>
    </div>
</template>
