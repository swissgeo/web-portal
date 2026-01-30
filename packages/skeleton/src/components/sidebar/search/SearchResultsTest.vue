<script setup lang="ts">
// Test component for SearchResults
import { ref } from 'vue'
import SearchResults from './SearchResults.vue'

// Define mock type locally for testing
type SearchResultMock = {
    id: string
    title: string
    sanitizedTitle: string
    description: string
    resultType: 'LOCATION' | 'LAYER'
}

// Mock mixed data (locations + layers)
const allResults = ref<SearchResultMock[]>([
    {
        id: 'loc-1',
        title: '<b>Zürich</b>, Switzerland',
        sanitizedTitle: 'Zürich, Switzerland',
        description: 'City in Canton Zürich',
        resultType: 'LOCATION',
    },
    {
        id: 'loc-2',
        title: 'Bern',
        sanitizedTitle: 'Bern',
        description: 'Capital of Switzerland',
        resultType: 'LOCATION',
    },
    {
        id: 'layer-1',
        title: 'Geological <b>Map</b> of Switzerland',
        sanitizedTitle: 'Geological Map of Switzerland',
        description: 'Geological layers and formations',
        resultType: 'LAYER',
    },
    {
        id: 'loc-3',
        title: 'Geneva',
        sanitizedTitle: 'Geneva',
        description: 'International city',
        resultType: 'LOCATION',
    },
    {
        id: 'layer-2',
        title: 'Topographic Map',
        sanitizedTitle: 'Topographic Map',
        description: 'Topographic features',
        resultType: 'LAYER',
    },
])

const selectedResult = ref<string | null>(null)

const handleSelect = (result: SearchResultMock) => {
    selectedResult.value = result.title
    console.log('Selected:', result)
}
</script>

<template>
    <div class="w-full bg-white h-full flex flex-col">
        <h3 class="p-4 font-bold border-b">SearchResults Test</h3>

        <!-- SearchResults component auto-groups by category -->
        <SearchResults :results="allResults" @select="handleSelect" />

        <div class="p-4 border-t bg-surface-50 flex-shrink-0">
            <p class="text-sm text-surface-600 break-words">
                <strong>Selected:</strong>
                <span v-if="selectedResult" v-html="selectedResult"></span>
                <span v-else class="text-surface-400">None</span>
            </p>
            <p class="text-xs text-surface-500 mt-2">
                Mixed results → auto-grouped into categories
            </p>
        </div>
    </div>
</template>
