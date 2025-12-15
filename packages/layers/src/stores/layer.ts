import { Layer } from '@/index'

export const useLayerStore = defineStore('layers', () => {
    const layers = ref<Layer[]>([])

    function addLayer(layer: Layer) {
        layers.value.push(layer)
    }

    function toggleVisibility(layerUuid: string) {
        const layer = layers.value.find((layer) => layer.uuid === layerUuid)
        if (!layer) {
            return
        }
        layer.isVisible = !layer?.isVisible
    }

    return {
        layers,
        addLayer,
        toggleVisibility,
    }
})
