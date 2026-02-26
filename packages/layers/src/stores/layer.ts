import log from '@swissgeo/log'
import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { Dimension, DimensionId, Layer, LayerInfo } from '@/index'

export const useLayerStore = defineStore('layers', () => {
    /** List of layers added to the map. Index 0 = bottom of stack, last index = top. */
    const layers = ref<Layer[]>([])

    /** Layer that's shown as background layer */
    const backgroundLayer = ref<Layer | null>(null)

    function addLayer(layer: Layer) {
        layers.value.push(layer)
    }

    /**
     * Returns the z-index for a layer based on its position in the layers array.
     * layers[0] is the bottom layer (lowest z-index), layers[n-1] is the top.
     * Returns -1 if the layer is not found (e.g. background layer).
     */
    function getLayerZIndex(uuid: string): number {
        return layers.value.findIndex((l) => l.uuid === uuid)
    }

    /** Move a layer one step up in the visual stack (toward top, higher index). */
    function moveLayerUp(uuid: string): void {
        const index = layers.value.findIndex((l) => l.uuid === uuid)
        if (index !== -1 && index < layers.value.length - 1) {
            const [layer] = layers.value.splice(index, 1)
            layers.value.splice(index + 1, 0, layer)
        }
    }

    /** Move a layer one step down in the visual stack (toward bottom, lower index). */
    function moveLayerDown(uuid: string): void {
        const index = layers.value.findIndex((l) => l.uuid === uuid)
        if (index > 0) {
            const [layer] = layers.value.splice(index, 1)
            layers.value.splice(index - 1, 0, layer)
        }
    }

    /** Move a layer to the top of the visual stack (end of the array). */
    function moveLayerToTop(uuid: string): void {
        const index = layers.value.findIndex((l) => l.uuid === uuid)
        if (index !== -1 && index !== layers.value.length - 1) {
            const [layer] = layers.value.splice(index, 1)
            layers.value.push(layer)
        }
    }

    function setBackground(layer: Layer | null) {
        backgroundLayer.value = layer
    }

    function getLayerByUuid(layerUuid: string) {
        if (backgroundLayer.value?.uuid === layerUuid) {
            return backgroundLayer.value
        }

        const layer = layers.value.find((layer: Layer) => layer.uuid === layerUuid)
        return layer
    }

    function toggleVisibility(layerUuid: string) {
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

            log.debug(`Updating ${layer.humanId} with dimension ${JSON.stringify(dimension)}`)

            const existingDimension = layer.dimensions[id]

            layer.dimensions[id] = {
                availableValues: existingDimension?.availableValues ?? [],
                currentValue: existingDimension?.currentValue ?? null,
                ...dimension,
            }
        }
    }

    function setOpacity(layerUuid: string, opacity: number) {
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
        const layer = getLayerByUuid(layerUuid)
        if (!layer) {
            return
        }
        layer.info = info
    }

    function removeLayer(layerUuid: string) {
        const layer = getLayerByUuid(layerUuid)
        if (!layer) {
            return null
        }
        const index = layers.value.indexOf(layer)
        layers.value.splice(index, 1)
    }

    return {
        layers,
        backgroundLayer,
        // getters
        getLayerZIndex,
        // actions
        addLayer,
        moveLayerUp,
        moveLayerDown,
        moveLayerToTop,
        toggleVisibility,
        setOpacity,
        setLayerInfo,
        setDimension,
        setBackground,
        removeLayer,
    }
})
