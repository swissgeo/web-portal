<script setup lang="ts">
// Complete search panel combining SearchBar + SearchResults
// Now using Pinia store for state management

import { useDebounceFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import SearchBar from './SearchBar.vue'
import SearchResults from './SearchResults.vue'
import { useSearchStore } from '@/stores/search'

const searchStore = useSearchStore()
const { locale } = useI18n()

// Debounced search (100ms delay)
const debouncedSearch = useDebounceFn((query: string) => {
    searchStore.setSearchQuery(query, locale.value)
}, 100)

function handleInput(value: string) {
    debouncedSearch(value)
}

function handleClear() {
    searchStore.clearSearch()
}

const emit = defineEmits<{
    'result-selected': [result: any]
}>()

function handleSelect(result: any) {
    console.log('=== SearchPanel handleSelect ===', result)
    emit('result-selected', result)
    console.log('=== Emitted result-selected event ===')
    searchStore.clearSearch()
}
</script>

<template>
    <div class="flex h-full w-full flex-col">
        <!-- Search input -->
        <SearchBar
            :model-value="searchStore.query"
            :is-searching="searchStore.isSearching"
            @update:model-value="handleInput"
            @clear="handleClear"
        />

        <!-- Results (when available) -->
        <SearchResults
            v-if="searchStore.hasResults"
            :results="searchStore.results"
            @select="handleSelect"
        />

        <!-- No results message -->
        <div
            v-else-if="searchStore.query.length >= 2 && !searchStore.isSearching"
            class="p-4 text-center text-surface-500"
        >
            {{ $t('search.no_results', 'No results found') }}
        </div>

        <!-- Placeholder message -->
        <div v-else class="p-4 text-surface-500">
            {{ $t('search.placeholder') }}
        </div>
    </div>
</template>
