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
     * Quick explanation on this interface:
     *  Right now, we have a distinction between
     *  - the source for layers, which tells the application where to look for the tiles / data
     *  - The map layers, which contains the information openlayers need to render the layers
     *
     * the visibility and opacity do not belong in the sources, but we do not want them to be overwritten by the
     * styling that happens on the first pass through the conversion pipeline
     *
     * These options are kept in the state on importing until the conversion pipeline is finished, then they are applied to the map layers and removed.
     * Once the importOptions object is empty, we know the import has been completed.
     */
    interface importOption {
        isVisible?: boolean
        opacity?: number
    }

    const importOptions = markRaw<Record<string, importOption>>({})

    function addImportOption(uuid: string, option: importOption) {
        importOptions[uuid] = option
    }
    function consumeImportOptions(uuid: string) {
        const options = importOptions[uuid]
        if (options) {
            const deepClonedOptions = structuredClone(options)
            delete importOptions[uuid]
            return deepClonedOptions
        }
    }

    function isThereImportOptions() {
        return !!Object.keys(importOptions).length
    }
    /**
     * Gets either an index or an uuid to identify a layer withing the map Layers,
     * and return the index at which the layer is.
     *
     *
     * @param uuid either the index in the array, or the layer's uuid
     * @returns the index itself, or the index found
     * @throws Error if the uuid is not found within the array
     */
    function _getIndexFromIdentifier(uuid: string): number | undefined {
        const index = layers.value.findIndex((layer) => layer.uuid === uuid)

        if (index < 0) {
            log.error(`Incorrect uuid given : ${uuid}`)
            return
        }
        return index
    }

    /**
     *
     * @param uuid either the layer uuid or its index in the layer store. We recommend using the uuid
     * @returns
     */
    function getLayer(uuid: string): Layer | undefined {
        const index = _getIndexFromIdentifier(uuid)
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

    function replaceLayer(uuid: string, replacement: Layer) {
        const index = _getIndexFromIdentifier(uuid)
        if ((index || index === 0) && layers.value[index]) {
            layers.value.splice(_getIndexFromIdentifier(uuid)!, 1, replacement)
        }
    }

    function setDimension(id: DimensionId, uuid: string, dimension: Partial<Dimension>) {
        const index = _getIndexFromIdentifier(uuid)

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

    function setLayerInfo(uuid: string, info: LayerInfo): void {
        log.debug(`Setting layer info for layer ${uuid} to ${JSON.stringify(info)}`)

        const index = _getIndexFromIdentifier(uuid)
        if ((index || index === 0) && layers.value[index]) {
            layers.value[index].info = info
        } else if (typeof uuid === 'string' && backgroundLayer.value?.uuid === uuid) {
            setBackgroundInfo(info)
        }
    }

    function setBackgroundInfo(info: LayerInfo) {
        if (backgroundLayer.value) {
            backgroundLayer.value.info = info
        }
    }

    function removeLayer(uuid: string) {
        const index = _getIndexFromIdentifier(uuid)
        if ((index || index === 0) && layers.value[index]) {
            layers.value.splice(index, 1)
        }
    }

    function setLayerData(uuid: string, dataset: Dataset) {
        const index = _getIndexFromIdentifier(uuid)
        if ((index || index === 0) && layers.value[index]) {
            layers.value[index].data = dataset
        } else if (typeof uuid === 'string' && backgroundLayer.value?.uuid === uuid) {
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
        isThereImportOptions,
        // actions
        addLayer,
        setBackground,
        replaceLayer,
        setBackgroundLayerData,
        setLayerInfo,
        setDimension,
        removeLayer,
        setLayerData,
        addImportOption,
        consumeImportOptions,
        $reset,
    }
})
