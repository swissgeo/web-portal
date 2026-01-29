<script setup lang="ts">
// Complete search panel combining SearchBar + SearchResults
// Mock data for now (will connect to store later)

import { ref } from 'vue'
import SearchBar from './SearchBar.vue'
import SearchResults from './SearchResults.vue'
import type { SearchResultMock } from './SearchResultEntry.vue'

const query = ref('')
const isSearching = ref(false)
const results = ref<SearchResultMock[]>([])

// Mock data that appears when searching
const mockAllResults: SearchResultMock[] = [
    {
        id: 'loc-1',
        title: 'Zurich, Switzerland',
        description: 'City in Canton Zurich',
        resultType: 'LOCATION',
    },
    {
        id: 'loc-2',
        title: 'Bern',
        description: 'Capital of Switzerland',
        resultType: 'LOCATION',
    },
    {
        id: 'layer-1',
        title: 'Geological Map',
        description: 'Geological layers',
        resultType: 'LAYER',
    },
    {
        id: 'loc-3',
        title: 'Geneva',
        description: 'International city',
        resultType: 'LOCATION',
    },
    {
        id: 'layer-2',
        title: 'Topographic Map',
        description: 'Topographic features',
        resultType: 'LAYER',
    },
]

// Handle input changes with debouncing simulation
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

function handleInput(value: string) {
    query.value = value

    // Clear previous timeout
    if (debounceTimeout) {
        clearTimeout(debounceTimeout)
    }

    // Clear results if query too short
    if (value.trim().length < 2) {
        results.value = []
        isSearching.value = false
        return
    }

    // Simulate debouncing and searching
    isSearching.value = true
    debounceTimeout = setTimeout(() => {
        // Filter mock results by query
        const searchTerm = value.toLowerCase()
        results.value = mockAllResults.filter(
            (r) =>
                r.title.toLowerCase().includes(searchTerm) ||
                r.description?.toLowerCase().includes(searchTerm)
        )
        isSearching.value = false
    }, 300) // 300ms debounce for visible effect
}

function handleClear() {
    query.value = ''
    results.value = []
    isSearching.value = false
}

function handleSelect(result: SearchResultMock) {
    console.log('Selected result:', result)
    // Later: will dispatch to store
}
</script>

<template>
    <div class="flex h-full w-full flex-col">
        <!-- Search input -->
        <SearchBar
            :model-value="query"
            :is-searching="isSearching"
            @update:model-value="handleInput"
            @clear="handleClear"
        />

        <!-- Results (when available) -->
        <SearchResults v-if="results.length > 0" :results="results" @select="handleSelect" />

        <!-- No results message -->
        <div
            v-else-if="query.length >= 2 && !isSearching"
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
