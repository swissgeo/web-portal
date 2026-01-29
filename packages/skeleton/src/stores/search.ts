// Search store for web-poc-portal
// Adapted from web-mapviewer search store

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SearchResultMock } from '@/components/sidebar/search/SearchResultEntry.vue'

// Mock data (will be replaced with real API calls later)
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

export const useSearchStore = defineStore('search', () => {
    // State
    const query = ref('')
    const results = ref<SearchResultMock[]>([])
    const isSearching = ref(false)

    // Getters
    const hasResults = computed(() => results.value.length > 0)

    const locationResults = computed(() =>
        results.value.filter((r) => r.resultType === 'LOCATION')
    )

    const layerResults = computed(() => results.value.filter((r) => r.resultType === 'LAYER'))

    // Actions
    async function setSearchQuery(newQuery: string) {
        query.value = newQuery

        // Clear results if query too short
        if (newQuery.trim().length < 2) {
            results.value = []
            return
        }

        isSearching.value = true

        // Simulate async search with timeout (will be replaced with real API)
        await new Promise((resolve) => setTimeout(resolve, 300))

        try {
            // Filter mock results
            const searchTerm = newQuery.toLowerCase()
            results.value = mockAllResults.filter(
                (r) =>
                    r.title.toLowerCase().includes(searchTerm) ||
                    r.description?.toLowerCase().includes(searchTerm)
            )
        } catch (error) {
            console.error('Search error:', error)
            results.value = []
        } finally {
            isSearching.value = false
        }
    }

    function selectResult(result: SearchResultMock) {
        console.log('Selected result:', result)

        // TODO: Later phases will implement:
        // - For locations: center map and add pin
        // - For layers: add layer to map

        // Clear search after selection
        clearSearch()
    }

    function clearSearch() {
        query.value = ''
        results.value = []
    }

    return {
        // State
        query,
        results,
        isSearching,
        // Getters
        hasResults,
        locationResults,
        layerResults,
        // Actions
        setSearchQuery,
        selectResult,
        clearSearch,
    }
})
