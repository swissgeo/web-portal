import type { Layer, LayerType } from '@swissgeo/layers'
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
        config.datasetId = layer.dataset.id
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

async function stateConfigToLayer(
    config: LayerStateConfig,
    zIndexOffset: number,
    ogcApiEndpoint: string
): Promise<Layer> {
    // If the layer has a datasetId, fetch the full dataset from the OGC API
    // so that the map can render it properly (needs links for WMTS/WMS capabilities)
    if (config.datasetId) {
        const dataset = await $fetch<Dataset>(`${ogcApiEndpoint}/items/${config.datasetId}`)
        return makeServerLayer(config.type as LayerType, dataset, {
            isVisible: config.isVisible,
            opacity: config.opacity,
            zIndex: config.zIndex ?? zIndexOffset,
        })
    }

    return {
        uuid: crypto.randomUUID(),
        humanId: config.humanId,
        type: config.type as Layer['type'],
        isVisible: config.isVisible,
        opacity: config.opacity,
        zIndex: config.zIndex ?? zIndexOffset,
        isLoading: false,
    }
}

/**
 * Composable for exporting and importing app state as JSON.
 */
export function useStateConfig() {
    const positionStore = usePositionStore()
    const layerStore = useLayerStore()
    const runtimeConfig = useRuntimeConfig()

    /**
     * Export the current app state as an AppStateConfig object.
     * Center coordinates are converted from the store's projection to WGS84 [lon, lat].
     */
    function exportState(): AppStateConfig {
        const centerWgs84 = positionStore.centerEpsg4326

        const state: AppStateConfig = {
            version: 1,
            map: {
                center: [centerWgs84[0], centerWgs84[1]],
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
     * Layers with a datasetId are fetched from the OGC API to get full dataset metadata.
     */
    async function importState(json: string): Promise<void> {
        const raw = JSON.parse(json) as unknown
        const config = parseAppState(raw)
        const ogcApiEndpoint = runtimeConfig.public.ogcApiEndpoint as string

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
            const layer = await stateConfigToLayer(layerConfig, i + 1, ogcApiEndpoint)
            layerStore.addLayer(layer)
        }

        // Set background layer
        if (config.backgroundLayer) {
            const bgLayer = await stateConfigToLayer(config.backgroundLayer, 0, ogcApiEndpoint)
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
