import type { Feature, Map } from 'ol'
import type { Geometry } from 'ol/geom'

import log from '@swissgeo/log'
import GeoJSON from 'ol/format/GeoJSON'
import Draw from 'ol/interaction/Draw'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Circle as CircleStyle, Fill, Icon, Stroke, Style, Text as TextStyle } from 'ol/style'

import type { MarkerIcon } from '@/utils/markerIcons';

import * as geoJsonUtils from '@/utils/geoJsonUtils'
import { DEFAULT_MARKER_ICON, getMarkerIconById } from '@/utils/markerIcons'

/**
 * Composable for handling OpenLayers drawing interactions
 */
export default function useOlDrawing(layerId: string, uuid: string, opacity: number) {
    const olMap = toValue(inject<Map>('olMap'))
    const drawingStore = useDrawingStore()

    // Track the currently selected icon for new point features
    const selectedIcon = ref<MarkerIcon>(DEFAULT_MARKER_ICON)

    if (!olMap) {
        log.error('OpenLayersMap is not available')
        throw new Error('OpenLayersMap is not available')
    }

    const source = new VectorSource({
        wrapX: false
        // wrapX: false, features: drawingStore.drawingFeatures as Feature<Geometry>[]
    })

    // Style function that handles both regular features and text features
    const styleFunction = (feature: Feature<Geometry>) => {
        const textContent = feature.get('text')
        if (textContent) {
            // Text feature styling
            return new Style({
                image: new CircleStyle({
                    radius: 0, // Invisible point
                    fill: new Fill({
                        color: 'rgba(0, 0, 0, 0)',
                    }),
                }),
                text: new TextStyle({
                    text: textContent,
                    font: '16px sans-serif',
                    fill: new Fill({
                        color: '#000',
                    }),
                    stroke: new Stroke({
                        color: '#fff',
                        width: 3,
                    }),
                    offsetY: 0,
                }),
            })
        }

        // Check if this is a Point geometry with an icon
        const geomType = feature.getGeometry()?.getType()
        if (geomType === 'Point') {
            const iconId = feature.get('iconId')
            const icon = iconId ? getMarkerIconById(iconId) : selectedIcon.value

            if (icon) {
                return new Style({
                    image: new Icon({
                        src: icon.dataUrl,
                        scale: 1,
                        anchor: [0.5, 1], // Bottom center of the icon
                        anchorXUnits: 'fraction',
                        anchorYUnits: 'fraction',
                    }),
                })
            }
        }

        // Regular feature styling (lines, polygons)
        return new Style({
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
    }

    function createOlLayer(layerId: string, uuid: string): VectorLayer {

        const olLayer = new VectorLayer({
            properties: {
                id: layerId,
                uuid,
            },
            opacity,
            source,
            style: styleFunction,
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
    function startDrawing(type: 'Point' | 'LineString' | 'Polygon' | 'Text', onFeatureAdded?: (feature: Feature<Geometry>) => void) {
        console.log('olDrawing startDrawing called with type:', type, source.getFeatures().length)
        // Stop any existing draw interaction first
        stopDrawing()

        addDrawingInteraction(type, onFeatureAdded)

        console.log('Draw interaction added to map', currentDraw)
        log.debug(`Started drawing ${type}, interaction added to map`)
    }

    function addDrawingInteraction(type: 'Point' | 'LineString' | 'Polygon' | 'Text', onFeatureAdded?: (feature: Feature<Geometry>) => void) {
        // For text, we use Point geometry
        const geometryType = type === 'Text' ? 'Point' : type

        currentDraw = new Draw({
            source,
            type: geometryType,
        })

        currentDraw.on('drawend', (event) => {
            log.debug(`Feature drawn: ${type}`, event.feature)
            console.log('Feature drawn, updating feature count')

            // If this is a text feature, set default text
            if (type === 'Text') {
                event.feature.set('text', 'New Text')
                // Force style update
                event.feature.changed()
            }

            // If this is a point feature, store the icon ID
            if (type === 'Point') {
                event.feature.set('iconId', selectedIcon.value.id)
                event.feature.changed()
            }

            // Notify that a feature was added (for UI updates like feature count)
            // No expensive KML conversion here - that happens only when closing the panel
            if (onFeatureAdded) {
                onFeatureAdded(event.feature)
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

    /**
     * Update the text of a feature
     */
    function updateFeatureText(feature: Feature<Geometry>, text: string) {
        feature.set('text', text)
        feature.changed()
        log.debug('Updated feature text:', text)
    }

    /**
     * Set the icon to use for new point features
     */
    function setSelectedIcon(icon: MarkerIcon) {
        selectedIcon.value = icon
        log.debug('Selected icon:', icon.id)
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
        updateFeatureText,
        setSelectedIcon,
        selectedIcon: readonly(selectedIcon),
    }
}
