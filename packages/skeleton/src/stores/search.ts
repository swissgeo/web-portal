// Search store for web-poc-portal
// Adapted from web-mapviewer search store

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { searchLayers, searchLocation } from '@swissgeo/search'
import type { SearchResult } from '@swissgeo/search'
import type { OGCRecords } from '@swissgeo/shared/ogc'

export const useSearchStore = defineStore('search', () => {
    // State
    const query = ref('')
    const results = ref<SearchResult[]>([])
    const isSearching = ref(false)
    const catalog = ref<OGCRecords | null>(null)

    let abortController: AbortController | null = null

    // Load catalog data on store initialization
    const loadCatalog = async () => {
        if (catalog.value) return
        try {
            const response = await fetch('/api/v1/layers/swissgeo/catalog')
            catalog.value = await response.json()
        } catch (error) {
            console.error('Failed to load catalog:', error)
        }
    }

    // Getters
    const hasResults = computed(() => results.value.length > 0)

    const locationResults = computed(() =>
        results.value.filter((r) => r.resultType === 'LOCATION')
    )

    const layerResults = computed(() => results.value.filter((r) => r.resultType === 'LAYER'))

    // Actions
    async function setSearchQuery(newQuery: string, lang: string = 'de') {
        query.value = newQuery

        // Clear results if query too short
        if (newQuery.trim().length < 2) {
            results.value = []
            return
        }

        // Cancel previous request
        if (abortController) {
            abortController.abort()
        }
        abortController = new AbortController()

        isSearching.value = true

        try {
            // Load catalog if not already loaded
            await loadCatalog()

            // Search both locations and layers in parallel
            const [locations, layers] = await Promise.all([
                searchLocation(newQuery, lang, abortController.signal),
                searchLayers(newQuery, lang, catalog.value?.records || []),
            ])

            // Combine results (locations first)
            results.value = [...locations, ...layers]
        } catch (error) {
            // Don't show error for aborted requests
            if (error instanceof Error && error.name === 'AbortError') {
                return
            }
            console.error('Search error:', error)
            results.value = []
        } finally {
            isSearching.value = false
            abortController = null
        }
    }

    function selectResult(result: SearchResult) {
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
