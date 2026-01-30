// Search store for web-poc-portal
// Adapted from web-mapviewer search store

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { searchLayers, searchLocation, searchLayerFeatures } from '@swissgeo/search'
import type { SearchResult } from '@swissgeo/search'
import type { OGCRecords } from '@swissgeo/shared/ogc'
import { useLayerStore } from '@swissgeo/layers'

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

    const locationResults = computed(() => results.value.filter((r) => r.resultType === 'LOCATION'))

    const layerResults = computed(() => results.value.filter((r) => r.resultType === 'LAYER'))

    const featureResults = computed(() => results.value.filter((r) => r.resultType === 'FEATURE'))

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
        const currentController = abortController

        isSearching.value = true

        try {
            // Load catalog if not already loaded
            await loadCatalog()

            // Get searchable layers from layer store
            // For now, enable feature search for ALL visible layers
            const layerStore = useLayerStore()
            const searchableLayers = layerStore.layers.filter((layer) => layer.isVisible)

            // Build search promises array
            const searchPromises: Promise<SearchResult[]>[] = [
                searchLocation(newQuery, lang, abortController.signal),
                searchLayers(newQuery, lang, catalog.value?.records || []),
            ]

            // Add feature search for each searchable layer
            for (const layer of searchableLayers) {
                searchPromises.push(
                    searchLayerFeatures(
                        newQuery,
                        lang,
                        layer.humanId,
                        layer.info?.displayName || layer.humanId,
                        abortController.signal
                    )
                )
            }

            // Execute all searches in parallel
            const allResults = await Promise.all(searchPromises)

            // Only update results if this request hasn't been superseded
            if (currentController === abortController) {
                // Flatten and combine results (locations, layers, then features)
                results.value = allResults.flat()
            }
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
        // Store the selected result for handling at app level
        // The app component will listen to result changes and handle:
        // - For locations: center map and zoom
        // - For layers: add layer to map

        // Note: Actual handling is done in the app component where
        // both position and layer stores are accessible

        // Clear search after selection
        clearSearch()

        // Return the result for external handling
        return result
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
        featureResults,
        // Actions
        setSearchQuery,
        selectResult,
        clearSearch,
    }
})
