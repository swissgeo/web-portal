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
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { usePositionStore } from '@swissgeo/map'
import { useSearchStore } from '@swissgeo/skeleton'

export function useSearchSelection() {
    async function handleResultSelection(result: SearchResult) {
        // Only run on client side to avoid SSR serialization issues
        if (!process.client) {
            return
        }

        if (result.resultType === 'LOCATION') {
            handleLocationSelection(result as LocationSearchResult)
        } else if (result.resultType === 'FEATURE') {
            handleFeatureSelection(result as FeatureSearchResult)
        } else if (result.resultType === 'LAYER') {
            await handleLayerSelection(result as LayerSearchResult)
        }
    }

    function handleLocationSelection(result: LocationSearchResult) {
        if (!result.coordinate) {
            return
        }

        const positionStore = usePositionStore()
        positionStore.setCenter(result.coordinate, { name: 'search-result-selection' })
        positionStore.setZoom(result.zoom, { name: 'search-result-selection' })
    }

    function handleFeatureSelection(result: FeatureSearchResult) {
        if (!result.coordinate) {
            return
        }

        const positionStore = usePositionStore()
        positionStore.setCenter(result.coordinate, { name: 'search-feature-selection' })

        const featureZoom = result.zoom && result.zoom > 0 && result.zoom < 20 ? result.zoom : 10
        positionStore.setZoom(featureZoom, { name: 'search-feature-selection' })
    }

    function isLayerExisting(layerId: string): boolean {
        const layerStore = useLayerStore()
        return layerStore.layers.some((layer) => layer.humanId === layerId)
    }

    async function handleLayerSelection(result: LayerSearchResult) {
        const layerStore = useLayerStore()
        const searchStore = useSearchStore()

        try {
            await searchStore.loadCatalog()
            const catalog = searchStore.catalog

            const layerRecord = catalog?.records.find((r: OGCRecord) => r.id === result.layerId)

            if (!layerRecord) {
                log.error({
                    title: 'useSearchSelection/handleLayerSelection',
                    titleColor: LogPreDefinedColor.Red,
                    messages: ['Layer not found in catalog:', result.layerId],
                })
                return
            }

            const distributionLink = layerRecord.links?.find(
                (link: Link) => link.rel === 'distributions'
            )

            if (!distributionLink) {
                log.error({
                    title: 'useSearchSelection/handleLayerSelection',
                    titleColor: LogPreDefinedColor.Red,
                    messages: ['No distribution link found for layer:', result.layerId],
                })
                return
            }

            const collectionData: OGCRecords = await $fetch(distributionLink.href)
            const layerType = getLayerType(collectionData)

            if (layerType && layerType !== 'UNKNOWN') {
                if (isLayerExisting(result.layerId)) {
                    log.info('Layer already exists in map:', result.layerId)
                    return
                }
                layerStore.addLayer(makeServerLayer(layerType, layerRecord))
            } else {
                log.error({
                    title: 'useSearchSelection/handleLayerSelection',
                    titleColor: LogPreDefinedColor.Red,
                    messages: ['Could not determine layer type for:', result.layerId],
                })
            }
        } catch (error) {
            log.error({
                title: 'useSearchSelection/handleLayerSelection',
                titleColor: LogPreDefinedColor.Red,
                messages: ['Failed to add layer to map:', error],
            })
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
