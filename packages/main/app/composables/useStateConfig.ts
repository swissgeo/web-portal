import type { Dimension, DimensionId, Layer } from '@swissgeo/layers'
import type { Layer as MapLayer } from '@swissgeo/map'
import type { Dataset } from '@swissgeo/ogc'
import type { AppStateConfig, AppStatePayload, LayerStateConfig } from '@swissgeo/statesharing'

import { useLayerStore, makeServerLayer } from '@swissgeo/layers'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { usePositionStore } from '@swissgeo/map'
import { APP_STATE_CONFIG_VERSION } from '@swissgeo/statesharing'

const DISPATCHER = { name: 'state-config' }

function layersToStateConfig(layers: MapLayer[]) {
    const layersState: Partial<AppStateConfig> = {
        layers: [],
    }
    if (layers.length > 0) {
        const backgroundLayerPresent = Number(!!useLayerStore().backgroundLayer)

        layers.slice(backgroundLayerPresent).map((mapLayer) => {
            layersState.layers!.push(layerToStateConfig(mapLayer))
        })
        if (backgroundLayerPresent === 1) {
            layersState.backgroundLayer = layerToStateConfig(layers[0]!)
        }
    }
    return layersState
}

function layerToStateConfig(layer: MapLayer): LayerStateConfig {
    let sourceData: Layer | undefined | null = useLayerStore().getLayer(layer.uuid)
    if (!sourceData) {
        sourceData = useLayerStore().backgroundLayer
        if (!sourceData || sourceData.uuid !== layer.uuid) {
            /*We can end up here in the following cases :
                1. A layer in the map Layers has no corresponding source
                    1.1 This most certainly means a source has been cleared without clearing the map,
                     or that a map has been removed without removing the source
                2. For some reason, the background layer is null AND is part of the mapview, which shouldn't happen
            */
            throw new Error(
                `A layer with uuid ${layer?.uuid} couldn't be transformed to a Layer State Config. Most probable reason is a difference between the source Data and the map Layers`
            )
        }
    }
    const layerUrl = sourceData.layerUrl

    const config: LayerStateConfig = {
        layerUrl,
        type: sourceData.type,
        isVisible: layer.isVisible,
        opacity: layer.opacity,
    }

    if (sourceData.dimensions) {
        config.dimensions = {}
        for (const [key, dim] of Object.entries(sourceData.dimensions)) {
            if (dim) {
                config.dimensions[key] = { currentValue: dim.currentValue }
            }
        }
    }

    return config
}

async function stateConfigToLayer(config: LayerStateConfig): Promise<Layer | null> {
    const layerOptions: Partial<Layer> = {}

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
    const mapviewStore = useMapViewStore()

    /**
     * Export the current app state as an AppStateConfig object.
     * Center coordinates are in LV95 (EPSG:2056) [x, y].
     */
    const exportState = computed((): AppStatePayload => {
        const payload: AppStatePayload = {
            version: APP_STATE_CONFIG_VERSION,
            state: {
                map: {
                    center: positionStore.center,
                    zoom: positionStore.zoom,
                    rotation: positionStore.rotation,
                },
                ...layersToStateConfig(mapviewStore.mapLayers),
            } as AppStateConfig,
        }
        return payload
    })

    /**
     * Import app state from a JSON string, applying it to the stores.
     * Center coordinates are expected in LV95 (EPSG:2056) [x, y].
     * Fetches each layer's dataset from its datasetUrl.
     */
    async function importState(payload: AppStatePayload): Promise<void> {
        log.info({
            title: 'useStateConfig',
            titleColor: LogPreDefinedColor.Sky,
            messages: ['Importing state config', payload],
        })

        positionStore.setCenter(payload.state.map.center, DISPATCHER)
        positionStore.setZoom(payload.state.map.zoom, DISPATCHER)
        positionStore.setRotation(payload.state.map.rotation, DISPATCHER)

        // Clear and re-add layers
        for (const layer of [...layerStore.layers]) {
            layerStore.removeLayer(layer.uuid)
        }
        for (const layer of [...mapviewStore.mapLayers]) {
            mapviewStore.removeLayer(layer.uuid)
        }

        // Fetch all layers in parallel
        const [layers, bgLayer] = await Promise.all([
            Promise.all(payload.state.layers.map((lc) => stateConfigToLayer(lc))),
            payload.state.backgroundLayer
                ? stateConfigToLayer(payload.state.backgroundLayer)
                : null,
        ])

        layerStore.setBackground(bgLayer)

        for (let i = 0; i < layers.length; i++) {
            if (layers[i]) {
                const uuid = layers[i]!.uuid
                // we're adding some information about visibility and opacity to apply after conversion
                // also setting defaults in case they are not specified
                const mapLayerData: Partial<MapLayer> = {
                    opacity: payload.state.layers[i]?.opacity ?? 1,
                    isVisible: payload.state.layers[i]?.isVisible ?? true,
                }
                layerStore.addImportOption(uuid, mapLayerData)
            }
        }
        for (let i = 0; i < layers.length; i++) {
            if (layers[i]) {
                layerStore.addLayer(layers[i]!)
            }
        }
    }

    return {
        exportState,
        importState,
    }
}
