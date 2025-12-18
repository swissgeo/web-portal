import log from '@swissgeo/log'

import type { Layer } from '@/index'

export const useLayerStore = defineStore('layers', () => {
    const layers = ref<Layer[]>([])

    const greatestZIndex = computed(() => {
        return layers.value.length
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
                        `Updating ${layer.record.id} from ${layer.zIndex} to ${layer.zIndex + 1}`
                    )
                    updatingLayer.zIndex += 1
                }
            } else if (direction === 'up') {
                if (updatingLayer.zIndex <= newIndex && updatingLayer.zIndex > currentIndex) {
                    // decrease all the layers between the currentIndex and the newIndex
                    log.debug(
                        `Updating ${layer.record.id} from ${layer.zIndex} to ${layer.zIndex - 1}`
                    )
                    updatingLayer.zIndex -= 1
                }
            }
        }
    }

    function toggleVisibility(layerUuid: string) {
        const layer = layers.value.find((layer: Layer) => layer.uuid === layerUuid)
        if (!layer) {
            return null
        }
        layer.isVisible = !layer.isVisible
    }

    return {
        layers,
        // getters
        greatestZIndex,
        // action
        addLayer,
        toggleVisibility,
        setLayerZIndex,
    }
})
