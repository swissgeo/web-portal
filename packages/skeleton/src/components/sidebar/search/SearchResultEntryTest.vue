<script setup lang="ts">
// Test component for SearchResultEntry
import { ref } from 'vue'
import SearchResultEntry from './SearchResultEntry.vue'
import type { SearchResultMock } from './SearchResultEntry.vue'

// Mock data
const mockResults = ref<SearchResultMock[]>([
    {
        id: '1',
        title: '<b>Zürich</b>, Switzerland',
        description: 'City in Canton Zürich',
        resultType: 'LOCATION',
    },
    {
        id: '2',
        title: 'Bern',
        description: 'Capital of Switzerland',
        resultType: 'LOCATION',
    },
    {
        id: '3',
        title: 'Geological <b>Map</b> of Switzerland',
        description: 'Geological layers and formations',
        resultType: 'LAYER',
    },
    {
        id: '4',
        title: 'Topographic Map',
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
    <div class="w-[400px] bg-white h-screen flex flex-col">
        <h3 class="p-4 font-bold border-b">SearchResultEntry Test</h3>

        <div class="flex-1 overflow-y-auto">
            <ul class="list-none">
                <SearchResultEntry
                    v-for="(result, idx) in mockResults"
                    :key="result.id"
                    :index="idx"
                    :entry="result"
                    @select="handleSelect(result)"
                />
            </ul>
        </div>

        <div class="p-4 border-t bg-surface-50">
            <p class="text-sm text-surface-600">
                <strong>Selected:</strong>
                <span v-if="selectedResult" v-html="selectedResult"></span>
                <span v-else class="text-surface-400">None</span>
            </p>
            <p class="text-xs text-surface-500 mt-2">
                Try: Click, Arrow keys, Home, End, Enter
            </p>
        </div>
    </div>
</template>
