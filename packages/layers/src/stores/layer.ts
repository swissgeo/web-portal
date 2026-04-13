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
    function _getIndexFromIdentifier(identifier: string | number): number {
        const index =
            typeof identifier === 'number'
                ? identifier
                : layers.value.findIndex((layer) => layer.uuid === identifier)

        if (index < 0) {
            throw new Error(`Incorrect identifier given : ${identifier}`)
        }
        return index
    }

    function setBackground(layer: Layer | null) {
        backgroundLayer.value = layer
    }

    function addLayer(layer: Layer) {
        layers.value.push(layer)
    }

    function replaceLayer(identifier: string | number, replacement: Layer) {
        layers.value.splice(_getIndexFromIdentifier(identifier), 1, replacement)
    }

    /**
     * Returns the z-index for a layer based on its position in the layers array.
     * layers[0] is the bottom layer (lowest z-index), layers[n-1] is the top.
     * Returns -1 if the layer is not found (e.g. background layer).
     */
    function getLayerZIndex(uuid: string): number {
        return layers.value.findIndex((l) => l.uuid === uuid)
    }

    /**
     * Set a layer to a specific index in the layers array.
     * Handles validation to ensure the target index is within bounds and differs from current position.
     */
    function setLayerIndex(identifier: string | number, targetIndex: number): void {
        const currentIndex = _getIndexFromIdentifier(identifier)
        // Validate: current index must be found, target must be in valid range, and must be different
        if (
            currentIndex >= 0 &&
            targetIndex < layers.value.length &&
            targetIndex >= 0 &&
            currentIndex !== targetIndex
        ) {
            const [layer] = layers.value.splice(currentIndex, 1) as [Layer]
            layers.value.splice(targetIndex, 0, layer)
        }
    }

    /** Move a layer one step up in the visual stack (toward top, higher index). */
    function moveLayerUp(identifier: string | number): void {
        setLayerIndex(identifier, _getIndexFromIdentifier(identifier) + 1)
    }

    /** Move a layer one step down in the visual stack (toward bottom, lower index). */
    function moveLayerDown(identifier: string | number): void {
        setLayerIndex(identifier, _getIndexFromIdentifier(identifier) - 1)
    }

    /** Move a layer to the top of the visual stack (end of the array). */
    function moveLayerToTop(identifier: string | number): void {
        setLayerIndex(identifier, layers.value.length - 1)
    }

    function getLayerByUuid(layerUuid: string) {
        const layer = layers.value.find((layer: Layer) => layer.uuid === layerUuid)
        return layer
    }

    function toggleVisibility(layerUuid: string): void {
        const layer = getLayerByUuid(layerUuid)
        if (!layer) {
            return null
        }
        layer.isVisible = !layer.isVisible
    }

    function setDimension(id: DimensionId, layerUuid: string, dimension: Partial<Dimension>) {
        const layer = getLayerByUuid(layerUuid)
        if (!layer) {
            log.error('Unable to find layer for setting available times', {
                messages: [layerUuid],
            })
        } else {
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

    function setOpacity(layerUuid: string, opacity: number): void {
        const layer = getLayerByUuid(layerUuid)
        if (!layer) {
            log.error(`Layer with uuid ${layerUuid} not found`)
            return null
        }
        const clampedOpacity = Math.max(0, Math.min(1, opacity))
        log.debug(`Setting opacity for ${layer.humanId} to ${clampedOpacity}`)
        layer.opacity = clampedOpacity
    }

    function setLayerInfo(layerUuid: string, info: LayerInfo): void {
        log.debug(`Setting layer info for ${layerUuid} to ${JSON.stringify(info)}`)
        const layer = getLayerByUuid(layerUuid)
        if (!layer) {
            return
        }
        layer.info = info
    }

    function removeLayer(layerUuid: string): void {
        const layer = getLayerByUuid(layerUuid)
        if (!layer) {
            return null
        }
        const index = layers.value.indexOf(layer)
        layers.value.splice(index, 1)
    }

    function setLayerData(layerUuid: string, dataset: Dataset): void {
        const layer = getLayerByUuid(layerUuid)
        if (!layer) {
            return null
        }
        layer.data = dataset
    }

    function $reset() {
        layers.value = []
    }

    return {
        layers,
        backgroundLayer,
        // getters
        getLayerZIndex,
        // actions
        addLayer,
        setBackground,
        replaceLayer,
        setLayerIndex,
        moveLayerUp,
        moveLayerDown,
        moveLayerToTop,
        toggleVisibility,
        setOpacity,
        setLayerInfo,
        setDimension,
        removeLayer,
        setLayerData,
        $reset,
    }
})
