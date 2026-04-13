import type { Dimension, DimensionId, Layer } from '@swissgeo/layers'
import type { Dataset } from '@swissgeo/ogc'
import type { AppStateConfig, AppStatePayload, LayerStateConfig } from '@swissgeo/statesharing'

import { useLayerStore, makeServerLayer } from '@swissgeo/layers'
import log from '@swissgeo/log'
import { usePositionStore } from '@swissgeo/map'
import { APP_STATE_CONFIG_VERSION } from '@swissgeo/statesharing'

const DISPATCHER = { name: 'state-config' }

function layerToStateConfig(layer: Layer): LayerStateConfig {
    const layerUrl = layer.layerUrl

    const config: LayerStateConfig = {
        layerUrl,
        type: layer.type,
        isVisible: layer.isVisible,
        opacity: layer.opacity,
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

async function stateConfigToLayer(config: LayerStateConfig): Promise<Layer | null> {
    const layerOptions: Partial<Layer> = {
        isVisible: config.isVisible,
        opacity: config.opacity,
    }

    if (config.dimensions) {
        const dims: Partial<Record<DimensionId, Dimension>> = {}
        for (const [key, val] of Object.entries(config.dimensions)) {
            dims[key as DimensionId] = { currentValue: val.currentValue, availableValues: [] }
        }
        layerOptions.dimensions = dims
    }

    if (config.layerUrl) {
        // TODO the state config needs to handle file layers
        const data = await $fetch<Dataset>(config.layerUrl)
        return makeServerLayer(data, layerOptions)
    }
    return null
}

/**
 * Composable for exporting and importing app state as JSON.
 */
export function useStateConfig() {
    const positionStore = usePositionStore()
    const layerStore = useLayerStore()

    /**
     * Export the current app state as an AppStateConfig object.
     * Center coordinates are in LV95 (EPSG:2056) [x, y].
     */
    const exportState = computed((): AppStatePayload => {
        const payload: AppStatePayload = {
            version: APP_STATE_CONFIG_VERSION,
            app: 'web-portal' as const,
            state: {
                map: {
                    center: positionStore.center,
                    zoom: positionStore.zoom,
                    rotation: positionStore.rotation,
                },
                layers: layerStore.layers.map((l: Layer) => layerToStateConfig(l)),
            } as AppStateConfig,
        }

        if (layerStore.backgroundLayer) {
            payload.state.backgroundLayer = layerToStateConfig(layerStore.backgroundLayer)
        }

        return payload
    })

    /**
     * Import app state from a JSON string, applying it to the stores.
     * Center coordinates are expected in LV95 (EPSG:2056) [x, y].
     * Fetches each layer's dataset from its datasetUrl.
     */
    async function importState(payload: AppStatePayload): Promise<void> {
        log.info('Importing state config', { messages: payload })

        positionStore.setCenter(payload.state.map.center, DISPATCHER)
        positionStore.setZoom(payload.state.map.zoom, DISPATCHER)
        positionStore.setRotation(payload.state.map.rotation, DISPATCHER)

        // Clear and re-add layers
        for (const layer of [...layerStore.layers]) {
            layerStore.removeLayer(layer.uuid)
        }

        // Fetch all layers in parallel
        const [layers, bgLayer] = await Promise.all([
            Promise.all(payload.state.layers.map((lc) => stateConfigToLayer(lc))),
            payload.state.backgroundLayer
                ? stateConfigToLayer(payload.state.backgroundLayer)
                : null,
        ])

        for (const layer of layers) {
            if (layer) {
                layerStore.addLayer(layer)
            }
        }

        layerStore.setBackground(bgLayer)
    }

    return {
        exportState,
        importState,
    }
}
