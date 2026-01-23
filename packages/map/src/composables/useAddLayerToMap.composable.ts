import type { Map } from 'ol'
// import LayerGroup from 'ol/layer/Group'
import type BaseLayer from 'ol/layer/Base'

import log from '@swissgeo/log'
import LayerGroup from 'ol/layer/Group'
import Layer from 'ol/layer/Layer'
import VectorSource from 'ol/source/Vector'

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
 * It is also possible to set a prop called zIndex, which will be used (if defined) to place the
 * layer accordingly in the layer stack of OpenLayers.
 */
export default function useAddLayerToMap(olLayer: BaseLayer, zIndex: number) {
    const olMap = toValue(inject<Map>('olMap'))
    if (!olMap) {
        log.error('OpenLayersMap is not available')
        throw new Error('OpenLayersMap is not available')
    }

    onMounted(() => {
        addLayerToMap()
    })

    onBeforeUnmount(() => {
        clearSources()
        removeLayerFromMap()
    })

    function clearSources() {
        if (olLayer instanceof Layer) {
            // if the source of this layer can be cleared (if it's a vector layer),
            // we clear it before removing it from the map, ensuring that all features are unloaded
            if ('getSource' in olLayer && olLayer.getSource() instanceof VectorSource) {
                ;(olLayer.getSource() as VectorSource).clear()
            }
            if ('setSource' in olLayer) {
                olLayer.setSource(null)
            }
        }
    }

    function addLayerToMap(): void {
        if (olMap) {
            olMap.addLayer(olLayer)
        }
        setZIndex(zIndex)
    }

    function removeLayerFromMap(): void {
        if (olMap) {
            // @ts-expect-error This ol layer should have the prop
            log.debug(`Removing layer ${olLayer.ol_uid} from map`, olLayer)
            olMap.removeLayer(olLayer)

            // TODO maybe there's more elegant version
            if (olLayer instanceof LayerGroup) {
                olLayer.getLayers().clear()
            }
        }
    }

    function setVisibility(isVisible: boolean) {
        olLayer.setVisible(isVisible)
    }

    function setZIndex(zIndex: number) {
        olLayer.setZIndex(zIndex)
    }

    return {
        addLayerToMap,
        removeLayerFromMap,
        setVisibility,
        setZIndex,
    }
}
