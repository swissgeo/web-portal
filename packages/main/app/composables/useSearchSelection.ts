// Composable to handle search result selection
// Connects search results to map actions (center, zoom, add layers)

import type { SearchResult, LocationSearchResult, LayerSearchResult } from '@swissgeo/search'
import type { OGCRecords } from '@swissgeo/shared/ogc'
import { useLayerStore, makeServerLayer, LayerType } from '@swissgeo/layers'
import { usePositionStore } from '@swissgeo/map'

export function useSearchSelection() {
    async function handleResultSelection(result: SearchResult) {
        console.log('=== handleResultSelection called ===', result)
        console.log('process.client:', process.client)

        // Only run on client side to avoid SSR serialization issues
        if (!process.client) return

        if (result.resultType === 'LOCATION') {
            // Center map on location
            const locationResult = result as LocationSearchResult
            console.log('Location result:', locationResult)

            if (locationResult.coordinate) {
                console.log('Setting center to:', locationResult.coordinate, 'zoom:', locationResult.zoom)
                const positionStore = usePositionStore()
                console.log('Position store:', positionStore)
                console.log('Current center before:', positionStore.center)
                positionStore.setCenter(locationResult.coordinate, { name: 'search-result-selection' })
                positionStore.setZoom(locationResult.zoom, { name: 'search-result-selection' })
                console.log('Current center after:', positionStore.center)
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
                const layerRecord = catalog.records.find((r: any) => r.id === layerResult.layerId)

                if (!layerRecord) {
                    console.error('Layer not found in catalog:', layerResult.layerId)
                    return
                }

                // Fetch distribution data to determine layer type
                const distributionLink = layerRecord.links?.find((link: any) => link.rel === 'distributions')

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
