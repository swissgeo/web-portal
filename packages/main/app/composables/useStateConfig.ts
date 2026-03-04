import type { Dimension, DimensionId, Layer, LayerType } from '@swissgeo/layers'
import type { Dataset } from '@swissgeo/ogc'
import type { AppStateConfig, LayerStateConfig } from '@swissgeo/shared'

import { WGS84 } from '@swissgeo/coordinates'
import { useLayerStore, makeServerLayer } from '@swissgeo/layers'
import log from '@swissgeo/log'
import { usePositionStore } from '@swissgeo/map'
import { parseAppState } from '@swissgeo/shared'
import proj4 from 'proj4'

const DISPATCHER = { name: 'state-config' }

function layerToStateConfig(layer: Layer): LayerStateConfig {
    const config: LayerStateConfig = {
        humanId: layer.humanId,
        type: layer.type,
        isVisible: layer.isVisible,
        opacity: layer.opacity,
        zIndex: layer.zIndex,
    }

    if (layer.dataset) {
        const distributionLink = layer.dataset.links?.find(
            (l) => l.rel.toLowerCase() === 'distributions'
        )
        if (distributionLink) {
            config.distributionsUrl = distributionLink.href
        }
    }

    if (layer.dimensions) {
        config.dimensions = {}
        for (const [key, dim] of Object.entries(layer.dimensions)) {
            if (dim) {
                config.dimensions[key] = { currentValue: dim.currentValue }
            }
        }
    }

    return config
}

function stateConfigToLayer(config: LayerStateConfig, zIndexOffset: number): Layer {
    const layerOptions: Partial<Layer> = {
        isVisible: config.isVisible,
        opacity: config.opacity,
        zIndex: config.zIndex ?? zIndexOffset,
    }

    if (config.dimensions) {
        const dims: Partial<Record<DimensionId, Dimension>> = {}
        for (const [key, val] of Object.entries(config.dimensions)) {
            dims[key as DimensionId] = { currentValue: val.currentValue, availableValues: [] }
        }
        layerOptions.dimensions = dims
    }

    if (config.distributionsUrl) {
        const fakeDataset: Dataset = {
            id: config.humanId,
            links: [
                {
                    href: config.distributionsUrl,
                    rel: 'distributions',
                    title: 'Distributions',
                    type: 'application/json',
                },
            ],
            properties: {
                title: config.humanId,
                type: 'Dataset' as const,
            },
        }
        return makeServerLayer(config.type as LayerType, fakeDataset, layerOptions)
    }

    return {
        uuid: crypto.randomUUID(),
        humanId: config.humanId,
        type: config.type as Layer['type'],
        isLoading: false,
        ...layerOptions,
    }
}

/**
 * Composable for exporting and importing app state as JSON.
 */
export function useStateConfig() {
    const positionStore = usePositionStore()
    const layerStore = useLayerStore()

    /**
     * Export the current app state as an AppStateConfig object.
     * Center coordinates are converted from the store's projection to WGS84 [lon, lat].
     */
    function exportState(): AppStateConfig {
        const state: AppStateConfig = {
            version: 1,
            map: {
                center: positionStore.centerEpsg4326,
                zoom: positionStore.zoom,
                rotation: positionStore.rotation,
            },
            layers: layerStore.layers.map((l: Layer) => layerToStateConfig(l)),
        }

        if (layerStore.backgroundLayer) {
            state.backgroundLayer = layerToStateConfig(layerStore.backgroundLayer)
        }

        return state
    }

    /**
     * Import app state from a JSON string, applying it to the stores.
     * Center coordinates are expected in WGS84 [lon, lat] and reprojected to the store's projection.
     */
    async function importState(json: string): Promise<void> {
        const raw = JSON.parse(json) as unknown
        const config = parseAppState(raw)

        log.info('Importing state config', { messages: [JSON.stringify(config.map)] })

        // Convert WGS84 [lon, lat] to the store's current projection
        const centerInProjection = proj4(
            WGS84.epsg,
            positionStore.projection.epsg,
            config.map.center
        )

        positionStore.setCenter([centerInProjection[0], centerInProjection[1]], DISPATCHER)
        positionStore.setZoom(config.map.zoom, DISPATCHER)
        positionStore.setRotation(config.map.rotation, DISPATCHER)

        // Clear and re-add layers
        for (const layer of [...layerStore.layers]) {
            layerStore.removeLayer(layer.uuid)
        }

        for (let i = 0; i < config.layers.length; i++) {
            const layerConfig = config.layers[i]!
            const layer = stateConfigToLayer(layerConfig, i + 1)
            layerStore.addLayer(layer)
        }

        // Set background layer
        if (config.backgroundLayer) {
            const bgLayer = stateConfigToLayer(config.backgroundLayer, 0)
            layerStore.setBackground(bgLayer)
        } else {
            layerStore.setBackground(null)
        }
    }

    return {
        exportState,
        importState,
    }
}
