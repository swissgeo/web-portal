import type { Feature, Map } from 'ol'
import type { Geometry } from 'ol/geom'

import log from '@swissgeo/log'
import Draw from 'ol/interaction/Draw'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'

/**
 * Composable for handling OpenLayers drawing interactions
 */
export default function useOlDrawing(layerId: string, uuid: string, opacity: number) {
    const olMap = toValue(inject<Map>('olMap'))
    if (!olMap) {
        log.error('OpenLayersMap is not available')
        throw new Error('OpenLayersMap is not available')
    }

    // Create a vector source and layer for drawing
    const source = new VectorSource()
    const layer = new VectorLayer({
        properties: {
            id: layerId,
            uuid,
        },
        opacity,
        source,
        style: new Style({
            fill: new Fill({
                color: 'rgba(255, 0, 0, 0.2)',
            }),
            stroke: new Stroke({
                color: '#ff0000',
                width: 2,
            }),
            image: new CircleStyle({
                radius: 7,
                fill: new Fill({
                    color: '#ff0000',
                }),
            }),
        }),
    })

    let currentDraw: Draw | null = null

    // Add layer to map immediately
    olMap.addLayer(layer)
    log.debug(`Added drawing layer ${layerId} to map`)

    onBeforeUnmount(() => {
        stopDrawing()
        source.clear()
        olMap.removeLayer(layer)
    })

    /**
     * Start drawing with the specified geometry type
     */
    function startDrawing(type: 'Point' | 'LineString' | 'Polygon', onFeatureAdded?: () => void) {
        console.log('olDrawing startDrawing called with type:', type)
        // Stop any existing draw interaction
        if (currentDraw) {
            console.log('Stopping existing draw interaction')
            olMap.removeInteraction(currentDraw)
            currentDraw = null
        }

        currentDraw = new Draw({
            source,
            type,
        })

        currentDraw.on('drawend', (event) => {
            log.debug(`Feature drawn: ${type}`, event.feature)
            console.log('Feature drawn, calling onFeatureAdded')
            // Notify that a feature was added
            if (onFeatureAdded) {
                onFeatureAdded()
            }
        })

        olMap.addInteraction(currentDraw)
        console.log('Draw interaction added to map')
        log.debug(`Started drawing ${type}, interaction added to map`)
    }

    /**
     * Stop the current drawing interaction
     */
    function stopDrawing() {
        console.log('stopDrawing called, currentDraw exists:', !!currentDraw, currentDraw)
        if (currentDraw) {
            console.log('Removing draw interaction from map')
            olMap.removeInteraction(currentDraw)
            currentDraw = null
            log.debug('Stopped drawing and removed interaction from map')
            console.log('Draw interaction removed successfully')
        } else {
            console.log('No draw interaction to remove')
        }
    }

    /**
     * Get all features from the drawing source
     */
    function getFeatures(): Feature<Geometry>[] {
        return source.getFeatures()
    }

    /**
     * Clear all features from the drawing
     */
    function clearFeatures() {
        source.clear()
        log.debug('Cleared all features')
    }

    /**
     * Add features to the drawing source
     */
    function addFeatures(features: Feature<Geometry>[]) {
        source.addFeatures(features)
        log.debug(`Added ${features.length} features to drawing`)
    }

    /**
     * Set the visibility of the drawing layer
     */
    function setVisibility(isVisible: boolean) {
        layer.setVisible(isVisible)
    }

    /**
     * Set the z-index of the drawing layer
     */
    function setZIndex(zIndex: number) {
        layer.setZIndex(zIndex)
    }

    return {
        layer,
        source,
        startDrawing,
        stopDrawing,
        getFeatures,
        clearFeatures,
        addFeatures,
        setVisibility,
        setZIndex,
    }
}
