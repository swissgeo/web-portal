import type { AppStateConfig, LayerStateConfig } from '@swissgeo/shared'

import { useLayerStore } from '@swissgeo/layers'
import type { Layer } from '@swissgeo/layers'
import log from '@swissgeo/log'
import { parseAppState } from '@swissgeo/shared'
import { WGS84 } from '@swissgeo/coordinates'
import proj4 from 'proj4'

import { usePositionStore } from '@swissgeo/map'

const DISPATCHER = { name: 'state-config' }

function layerToStateConfig(layer: Layer): LayerStateConfig {
    const config: LayerStateConfig = {
        humanId: layer.humanId,
        type: layer.type,
        isVisible: layer.isVisible,
        opacity: layer.opacity,
        zIndex: layer.zIndex,
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
     */
    function importState(json: string): void {
        const raw = JSON.parse(json) as unknown
        const config = parseAppState(raw)

        log.info('Importing state config', { messages: [JSON.stringify(config.map)] })

        // Convert WGS84 [lon, lat] to the store's current projection
        const centerInProjection = proj4(
            WGS84.epsg,
            positionStore.projection.epsg,
            config.map.center
        )

        positionStore.setCenter(
            [centerInProjection[0], centerInProjection[1]],
            DISPATCHER
        )
        positionStore.setZoom(config.map.zoom, DISPATCHER)
        positionStore.setRotation(config.map.rotation, DISPATCHER)

        // Clear and re-add layers
        for (const layer of [...layerStore.layers]) {
            layerStore.removeLayer(layer.uuid)
        }

        for (let i = 0; i < config.layers.length; i++) {
            const layerConfig = config.layers[i]!
            layerStore.addLayer(stateConfigToLayer(layerConfig, i + 1))
        }

        // Set background layer
        if (config.backgroundLayer) {
            layerStore.setBackground(stateConfigToLayer(config.backgroundLayer, 0))
        } else {
            layerStore.setBackground(null)
        }
    }

    return {
        exportState,
        importState,
    }
}
