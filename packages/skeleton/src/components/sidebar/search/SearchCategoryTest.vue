<script setup lang="ts">
// Test component for SearchCategory
import { ref } from 'vue'
import SearchCategory from './SearchCategory.vue'
import type { SearchResultMock } from './SearchResultEntry.vue'

// Mock data separated by category
const locationResults = ref<SearchResultMock[]>([
    {
        id: 'loc-1',
        title: '<b>Zürich</b>, Switzerland',
        description: 'City in Canton Zürich',
        resultType: 'LOCATION',
    },
    {
        id: 'loc-2',
        title: 'Bern',
        description: 'Capital of Switzerland',
        resultType: 'LOCATION',
    },
    {
        id: 'loc-3',
        title: 'Geneva',
        description: 'International city',
        resultType: 'LOCATION',
    },
])

const layerResults = ref<SearchResultMock[]>([
    {
        id: 'layer-1',
        title: 'Geological <b>Map</b> of Switzerland',
        description: 'Geological layers and formations',
        resultType: 'LAYER',
    },
    {
        id: 'layer-2',
        title: 'Topographic Map',
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
        <h3 class="p-4 font-bold border-b">SearchCategory Test</h3>

        <div class="flex-1 overflow-y-auto">
            <!-- Two categories: Locations and Layers -->
            <SearchCategory
                title="Locations"
                :results="locationResults"
                @select="handleSelect"
            />

            <SearchCategory title="Layers" :results="layerResults" @select="handleSelect" />
        </div>

        <div class="p-4 border-t bg-surface-50 flex-shrink-0">
            <p class="text-sm text-surface-600 break-words">
                <strong>Selected:</strong>
                <span v-if="selectedResult" v-html="selectedResult"></span>
                <span v-else class="text-surface-400">None</span>
            </p>
            <p class="text-xs text-surface-500 mt-2">Keyboard nav across categories</p>
        </div>
    </div>
</template>
