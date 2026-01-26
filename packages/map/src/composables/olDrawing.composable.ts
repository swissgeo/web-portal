import type { Feature, Map } from 'ol'
import type { Geometry } from 'ol/geom'

import log from '@swissgeo/log'
import GeoJSON from 'ol/format/GeoJSON'
import Draw from 'ol/interaction/Draw'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'

import * as geoJsonUtils from '@/utils/geoJsonUtils'

/**
 * Composable for handling OpenLayers drawing interactions
 */
export default function useOlDrawing(layerId: string, uuid: string, opacity: number) {
    const olMap = toValue(inject<Map>('olMap'))
    const drawingStore = useDrawingStore()
    if (!olMap) {
        log.error('OpenLayersMap is not available')
        throw new Error('OpenLayersMap is not available')
    }

    const source = new VectorSource({
        wrapX: false
        // wrapX: false, features: drawingStore.drawingFeatures as Feature<Geometry>[]
    })

    // Create reusable style to avoid recreation on every render
    const drawingStyle = new Style({
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
    })

    function createOlLayer(layerId: string, uuid: string): VectorLayer {

        const olLayer = new VectorLayer({
            properties: {
                id: layerId,
                uuid,
            },
            opacity,
            source,
            style: drawingStyle,
        })
        // layer.setSource(
        //     new VectorSource({
        //         features: new GeoJSON().readFeatures(
        //             geoJsonUtils.reprojectGeoJsonData(geoJsonData, projection.value)
        //         ),
        //     })
        // )
        // Use markRaw to prevent Vue from making this reactive (huge performance improvement)
        drawingStore.setOlLayer(markRaw(olLayer))
        return olLayer
    }

    // Create a vector source and layer for drawing
    // const source = new VectorSource()
    // const layer = new VectorLayer({
    //     properties: {
    //         id: layerId,
    //         uuid,
    //     },
    //     opacity,
    //     source,
    //     style: new Style({
    //         fill: new Fill({
    //             color: 'rgba(255, 0, 0, 0.2)',
    //         }),
    //         stroke: new Stroke({
    //             color: '#ff0000',
    //             width: 2,
    //         }),
    //         image: new CircleStyle({
    //             radius: 7,
    //             fill: new Fill({
    //                 color: '#ff0000',
    //             }),
    //         }),
    //     }),
    // })

    let currentDraw: Draw | null = null
    // let updateTimeout: ReturnType<typeof setTimeout> | null = null
    const layer = createOlLayer(layerId, uuid)
    // Add layer to map immediately
    olMap.addLayer(layer)
    log.debug(`Added drawing layer ${layerId} to map`)

    onBeforeUnmount(() => {
        stopDrawing()
        // if (updateTimeout) {
        //     clearTimeout(updateTimeout)
        //     updateTimeout = null
        // }
        olMap.removeLayer(layer)
    })

    /**
     * Start drawing with the specified geometry type
     */
    function startDrawing(type: 'Point' | 'LineString' | 'Polygon', onFeatureAdded?: () => void) {
        console.log('olDrawing startDrawing called with type:', type, source.getFeatures().length)
        // Stop any existing draw interaction first
        stopDrawing()

        addDrawingInteraction(type, onFeatureAdded)

        console.log('Draw interaction added to map', currentDraw)
        log.debug(`Started drawing ${type}, interaction added to map`)
    }

    function addDrawingInteraction(type: 'Point' | 'LineString' | 'Polygon', onFeatureAdded?: () => void) {
        currentDraw = new Draw({
            source,
            type,
        })

        currentDraw.on('drawend', (event) => {
            log.debug(`Feature drawn: ${type}`, event.feature)
            console.log('Feature drawn, updating feature count')

            // Notify that a feature was added (for UI updates like feature count)
            // No expensive KML conversion here - that happens only when closing the panel
            if (onFeatureAdded) {
                onFeatureAdded()
            }
        })

        olMap.addInteraction(currentDraw)
    }

    /**
     * Stop the current drawing interaction
     */
    function stopDrawing() {
        console.log('stopDrawing called, currentDraw exists:', !!currentDraw, currentDraw)
        if (currentDraw) {
            console.log('Removing draw interaction from map')
            currentDraw.setActive(false) // Deactivate first
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
        // if (currentDraw) {
        //     currentDraw.setActive(false) // Deactivate first
        //     olMap.removeInteraction(currentDraw)
        // }
        // currentDraw = null
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
