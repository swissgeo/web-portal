<script setup lang="ts">
// Adapted from web-mapviewer SearchResultCategory.vue

import type { SearchResult } from '@swissgeo/search'

import { ref } from 'vue'

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

// Focus management for keyboard navigation
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

// Expose methods for parent to call
defineExpose({
    focusFirstEntry,
    focusLastEntry,
})
</script>

<template>
    <!-- Category container -->
    <div class="search-category">
        <!-- Category header -->
        <div class="bg-surface-50 text-surface-700 px-4 py-2 text-sm font-semibold">
            {{ title }}
        </div>

        <!-- Results list -->
        <ul
            class="list-none"
            tabindex="-1"
        >
            <SearchResultEntry
                v-for="(entry, index) in results"
                :key="entry.id"
                ref="entries"
                :index="index"
                :entry="entry"
                @select="emit('select', entry)"
                @first-entry-reached="emit('firstEntryReached')"
                @last-entry-reached="emit('lastEntryReached')"
            />
        </ul>
    </div>
</template>
