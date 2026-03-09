import type { Map } from 'ol'
// import LayerGroup from 'ol/layer/Group'
import type BaseLayer from 'ol/layer/Base'
import type { Ref } from 'vue'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import LayerGroup from 'ol/layer/Group'
import Layer from 'ol/layer/Layer'
import VectorSource from 'ol/source/Vector'
import { onBeforeUnmount, toRaw, watchEffect } from 'vue'

/**
 * Vue composable that will handle the addition or removal of an OpenLayers layer. This is a
 * centralized way of describing this logic.
 *
 * The composable will manage the layer and will remove it from the map as soon as the component
 * that has used this composable is removed from the DOM.
 *
 * This layer should be one of OpenLayers JS API layer type, i.e. `/ol/layer/Vector`,
 * `/ol/layer/Tile`, etc...
 *
 */
export default function useAddLayerToMap(
    olLayer: Ref<BaseLayer | undefined>,
    zIndex: Ref<number>,
    isVisible: Ref<boolean>,
    opacity: Ref<number>,
    olMap: Ref<Map | undefined> | undefined
) {
    onBeforeUnmount(() => {
        clearSources()
        removeLayerFromMap()
    })

    function clearSources() {
        if (olLayer.value instanceof Layer) {
            // if the source of this layer can be cleared (if it's a vector layer),
            // we clear it before removing it from the map, ensuring that all features are unloaded
            if ('getSource' in olLayer && olLayer.value.getSource() instanceof VectorSource) {
                ;(olLayer.value.getSource() as VectorSource).clear()
            }
            if ('setSource' in olLayer) {
                olLayer.value.setSource(null)
            }
        }
    }

    function addLayerToMap(): void {
        if (!olMap || !olMap.value || !olLayer.value) {
            return
        }
        log.debug({
            title: 'useAddLayerToMap',
            titleColor: LogPreDefinedColor.Amber,
            messages: [
                // @ts-expect-error This ol layer should have the prop
                `Going to add layer ${olLayer.value.ol_uid} to map ${olMap.value.ol_uid} with zIndex ${zIndex.value}`,
                olLayer.value,
                olMap.value,
            ],
        })
        olMap.value.addLayer(toRaw(olLayer.value))
        setZIndex(zIndex.value)
    }

    function removeLayerFromMap(): void {
        if (!olMap || !olMap.value || !olLayer.value) {
            return
        }
        log.debug({
            title: 'useAddLayerToMap',
            titleColor: LogPreDefinedColor.Amber,
            // @ts-expect-error This ol layer should have the prop
            messages: ['Removing layer from map', olLayer.value.ol_uid],
        })
        olMap.value.removeLayer(olLayer.value)

        // TODO maybe there's more elegant version
        if (olLayer.value instanceof LayerGroup) {
            olLayer.value.getLayers().clear()
        }
    }

    function setVisibility(isVisible: boolean) {
        if (olLayer.value) {
            olLayer.value.setVisible(isVisible)
        }
    }

    function setZIndex(zIndex: number) {
        if (olLayer.value) {
            olLayer.value.setZIndex(zIndex)
        }
    }

    function setOpacity(opacity: number) {
        if (olLayer.value) {
            olLayer.value.setOpacity(opacity)
        }
    }

    watchEffect(() => {
        setZIndex(zIndex.value)
    })

    watchEffect(() => {
        setVisibility(isVisible.value)
    })

    watchEffect(() => {
        setOpacity(opacity.value)
    })

    return {
        addLayerToMap,
        removeLayerFromMap,
        setVisibility,
        setZIndex,
        setOpacity,
    }
}
