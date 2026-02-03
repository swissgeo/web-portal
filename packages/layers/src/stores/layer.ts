import log from '@swissgeo/log'
import { cloneDeep } from 'lodash'

import type { Dimension, DimensionId, Layer, LayerInfo } from '@/index'

export const useLayerStore = defineStore('layers', () => {
    /** List of layers added to the map */
    const layers = ref<Layer[]>([])

    /** Layer that's shown as background layer */
    const backgroundLayer = ref<Layer | null>()

    const previewYear = ref<undefined | number>(undefined)
    const greatestZIndex = computed(() => {
        return layers.value.length
    })

    /** Sort and return layers by zIndex */
    const sortedLayers = computed(() => {
        // sort is in-place, this would trigger a reactivity loop of death
        return cloneDeep(layers.value).sort((a: Layer, b: Layer) => a.zIndex - b.zIndex)
    })

    const visibleLayers = computed(() => {
        return layers.value.filter((layer) => layer.isVisible)
    })

    const visibleLayersWithTimeConfig = computed(() => {
        log.debug('visible Layers With Time Config is not yet implemented.')
        return layers.value.filter(
            (layer) => layer.isVisible /** && layer.hasTimeConfig <-- we'll see where it is */
        )
    })

    function addLayer(layer: Layer) {
        layers.value.push(layer)
    }

    function setLayerZIndex(layer: Layer, newIndex: number) {
        const currentIndex = layer.zIndex

        const direction = newIndex > currentIndex ? 'up' : 'down'

        for (const updatingLayer of layers.value) {
            if (updatingLayer.uuid === layer.uuid) {
                updatingLayer.zIndex = newIndex
            } else if (direction === 'down') {
                if (updatingLayer.zIndex >= newIndex && updatingLayer.zIndex < currentIndex) {
                    // increase all the layers between the newIndex and the currentIndex
                    log.debug(
                        `Updating ${layer.humanId} from ${layer.zIndex} to ${layer.zIndex + 1}`
                    )
                    updatingLayer.zIndex += 1
                }
            } else if (direction === 'up') {
                if (updatingLayer.zIndex <= newIndex && updatingLayer.zIndex > currentIndex) {
                    // decrease all the layers between the currentIndex and the newIndex
                    log.debug(
                        `Updating ${layer.humanId} from ${layer.zIndex} to ${layer.zIndex - 1}`
                    )
                    updatingLayer.zIndex -= 1
                }
            }
        }
    }

    function setBackground(layer: DatasetLayer) {
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

    // TODO this one is currently un-used. consider removing it
    function setLayerInfo(layerUuid: string, info: LayerInfo): void {
        const layer = getLayerByUuid(layerUuid)
        if (!layer) {
            return
        }
        layer.info = info
    }

    function setPreviewYear(year: number | undefined) {
        previewYear.value = year
    }
    /**
     * I don't think this should be exported... if this is needed outside of this store, then maybe
     * this should trigger a re-thinking of the architecture here
     */
    function _updateZIndex() {
        let index = 1
        for (const layer of sortedLayers.value) {
            const realLayer = getLayerByUuid(layer.uuid)
            if (!realLayer) {
                log.error(`Unable to find layer with uuid ${layer.uuid}`)
                // rather unlikely
            } else {
                realLayer.zIndex = index
                index++
            }
        }
    }

    function removeLayer(layerUuid: string) {
        const layer = getLayerByUuid(layerUuid)
        if (!layer) {
            return null
        }
        const index = layers.value.indexOf(layer)
        layers.value.splice(index, 1)
        _updateZIndex()
    }

    return {
        layers,
        backgroundLayer,
        // getters
        greatestZIndex,
        sortedLayers,
        visibleLayers,
        visibleLayersWithTimeConfig,
        // action
        addLayer,
        toggleVisibility,
        setLayerZIndex,
        setLayerInfo,
        setDimension,
        setBackground,
        setPreviewYear,
        removeLayer,
    }
})
