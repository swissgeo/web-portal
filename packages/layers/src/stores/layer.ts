import type { Dataset } from '@swissgeo/ogc'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { Dimension, DimensionId, Layer, LayerInfo } from '@/index'

export const useLayerStore = defineStore('layers', () => {
    /** List of layers added to the map. Index 0 = bottom of stack, last index = top. */
    const layers = ref<Layer[]>([])

    /** The active background layer, or null if none is selected. */
    const backgroundLayer = ref<Layer | null>(null)

    /**
     * Gets either an index or an uuid to identify a layer withing the map Layers,
     * and return the index at which the layer is.
     *
     *
     * @param identifier either the index in the array, or the layer's uuid
     * @returns the index itself, or the index found
     * @throws Error if the uuid is not found within the array
     */
    function _getIndexFromIdentifier(identifier: string | number): number | undefined {
        const index =
            typeof identifier === 'number'
                ? identifier
                : layers.value.findIndex((layer) => layer.uuid === identifier)

        if (index < 0) {
            log.error(`Incorrect identifier given : ${identifier}`)
            return
        }
        return index
    }

    /**
     *
     * @param identifier either the layer uuid or its index in the layer store. We recommend using the uuid
     * @returns
     */
    function getLayer(identifier: string | number): Layer | undefined {
        const index = _getIndexFromIdentifier(identifier)
        if ((index || index === 0) && layers.value[index]) {
            return layers.value[index]
        }
    }
    function setBackground(layer: Layer | null) {
        backgroundLayer.value = layer
    }

    function setBackgroundLayerData(data: Dataset) {
        if (backgroundLayer.value) {
            backgroundLayer.value.data = data
        }
    }

    function addLayer(layer: Layer) {
        layers.value.push(layer)
    }

    function replaceLayer(identifier: string | number, replacement: Layer) {
        const index = _getIndexFromIdentifier(identifier)
        if ((index || index === 0) && layers.value[index]) {
            layers.value.splice(_getIndexFromIdentifier(identifier), 1, replacement)
        }
    }

    function setDimension(
        id: DimensionId,
        identifier: string | number,
        dimension: Partial<Dimension>
    ) {
        const index = _getIndexFromIdentifier(identifier)

        if ((index || index === 0) && layers.value[index]) {
            const layer = layers.value[index]
            if (!layer.dimensions) {
                layer.dimensions = {}
            }

            log.debug({
                title: 'layer Store',
                titleColor: LogPreDefinedColor.Cyan,
                messages: [`Updating ${layer.humanId} with dimension ${JSON.stringify(dimension)}`],
            })

            const existingDimension = layer.dimensions[id]

            layer.dimensions[id] = {
                availableValues: existingDimension?.availableValues ?? [],
                currentValue: existingDimension?.currentValue ?? null,
                ...dimension,
            }
        }
    }

    function setLayerInfo(identifier: string | number, info: LayerInfo): void {
        log.debug(`Setting layer info for layer ${identifier} to ${JSON.stringify(info)}`)

        const index = _getIndexFromIdentifier(identifier)
        if ((index || index === 0) && layers.value[index]) {
            layers.value[index].info = info
        } else if (typeof identifier === 'string' && backgroundLayer.value?.uuid === identifier) {
            setBackgroundInfo(info)
        }
    }

    function setBackgroundInfo(info: LayerInfo) {
        if (backgroundLayer.value) {
            backgroundLayer.value.info = info
        }
    }

    function removeLayer(identifier: string | number) {
        const index = _getIndexFromIdentifier(identifier)
        if ((index || index === 0) && layers.value[index]) {
            layers.value.splice(index, 1)
        }
    }

    function setLayerData(identifier: string | number, dataset: Dataset) {
        const index = _getIndexFromIdentifier(identifier)
        if ((index || index === 0) && layers.value[index]) {
            layers.value[index].data = dataset
        } else if (typeof identifier === 'string' && backgroundLayer.value?.uuid === identifier) {
            setBackgroundLayerData(dataset)
        }
    }

    function $reset() {
        layers.value = []
    }

    return {
        layers,
        backgroundLayer,
        // getters
        getLayer,
        // actions
        addLayer,
        setBackground,
        replaceLayer,
        setBackgroundLayerData,
        setLayerInfo,
        setDimension,
        removeLayer,
        setLayerData,
        $reset,
    }
})
