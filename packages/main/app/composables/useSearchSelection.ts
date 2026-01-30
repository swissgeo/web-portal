// Composable to handle search result selection
// Connects search results to map actions (center, zoom, add layers)

import type {
    SearchResult,
    LocationSearchResult,
    LayerSearchResult,
    FeatureSearchResult,
} from '@swissgeo/search'
import type { OGCRecords, OGCRecord, Link } from '@swissgeo/shared/ogc'
import { useLayerStore, makeServerLayer, LayerType } from '@swissgeo/layers'
import { usePositionStore } from '@swissgeo/map'

export function useSearchSelection() {
    async function handleResultSelection(result: SearchResult) {
        // Only run on client side to avoid SSR serialization issues
        if (!process.client) return

        if (result.resultType === 'LOCATION') {
            // Center map on location
            const locationResult = result as LocationSearchResult

            if (locationResult.coordinate) {
                const positionStore = usePositionStore()
                positionStore.setCenter(locationResult.coordinate, {
                    name: 'search-result-selection',
                })
                positionStore.setZoom(locationResult.zoom, { name: 'search-result-selection' })
            }
        } else if (result.resultType === 'FEATURE') {
            // Center map on feature and zoom in close to see the feature
            const featureResult = result as FeatureSearchResult

            if (featureResult.coordinate) {
                const positionStore = usePositionStore()
                positionStore.setCenter(featureResult.coordinate, {
                    name: 'search-feature-selection',
                })
                // Use zoom level from API if valid and reasonable, otherwise zoom in to level 10
                // Features need closer zoom than city-level searches
                const featureZoom =
                    featureResult.zoom && featureResult.zoom > 0 && featureResult.zoom < 20
                        ? featureResult.zoom
                        : 10
                positionStore.setZoom(featureZoom, { name: 'search-feature-selection' })
            }
        } else if (result.resultType === 'LAYER') {
            const layerStore = useLayerStore()
            // Add layer to map
            const layerResult = result as LayerSearchResult

            try {
                // Fetch the catalog to find the layer record
                const catalogResponse = await fetch('/api/v1/layers/swissgeo/catalog')
                const catalog = await catalogResponse.json()

                // Find the layer record in the catalog
                const layerRecord = catalog.records.find(
                    (r: OGCRecord) => r.id === layerResult.layerId
                )

                if (!layerRecord) {
                    console.error('Layer not found in catalog:', layerResult.layerId)
                    return
                }

                // Fetch distribution data to determine layer type
                const distributionLink = layerRecord.links?.find(
                    (link: Link) => link.rel === 'distributions'
                )

                if (!distributionLink) {
                    console.error('No distribution link found for layer:', layerResult.layerId)
                    return
                }

                const collectionData: OGCRecords = await $fetch(distributionLink.href)

                // Determine layer type from distributions
                const layerType = getLayerType(collectionData)

                if (layerType && layerType !== 'UNKNOWN') {
                    layerStore.addLayer(makeServerLayer(layerType, layerRecord))
                } else {
                    console.error('Could not determine layer type for:', layerResult.layerId)
                }
            } catch (error) {
                console.error('Failed to add layer to map:', error)
            }
        }
    }

    // Helper function to determine layer type from distribution data
    function getLayerType(collectionData: OGCRecords): LayerType | 'UNKNOWN' {
        const preferredDistributionId = collectionData.portal?.preferredDistributionId || null

        for (const record of collectionData.records) {
            // If there's no preferredDistributionId, select the first one found
            if (preferredDistributionId === null || record.id === preferredDistributionId) {
                const protocol = record.properties?.protocol

                if (protocol === 'OGC:WMTS') {
                    return LayerType.WMTS
                } else if (protocol === 'OGC:WMS') {
                    return LayerType.WMS
                } else if (protocol === 'OGC:GeoJSON') {
                    return LayerType.GEOJSON
                }
            }
        }

        return 'UNKNOWN'
    }

    return {
        handleResultSelection,
    }
}
