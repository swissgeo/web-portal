import type { Feature, Map } from 'ol'
import type { Geometry } from 'ol/geom'
import type { Type } from 'ol/geom/Geometry'
import type { StyleFunction, StyleLike } from 'ol/style/Style'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import Draw from 'ol/interaction/Draw'
import VectorLayer from 'ol/layer/Vector'
import { register } from 'ol/proj/proj4'
import VectorSource from 'ol/source/Vector'
import { Circle as CircleStyle, Fill, Icon, Stroke, Style } from 'ol/style'
import proj4 from 'proj4'
import { inject, markRaw, onBeforeUnmount, readonly, ref, toValue } from 'vue'

import type { DrawingMode } from '@/types'
import type { MarkerIcon } from '@/utils/markerIcons'

import { useDrawingStore } from '@/stores/drawing'
import { DEFAULT_MARKER_ICON, getMarkerIconById } from '@/utils/markerIcons'
import { createTextFeatureStyle } from '@/utils/textFeatureStyle'
/**
 * Composable for handling OpenLayers drawing interactions
 */
export function useOlDrawing(layerId: string, uuid: string, opacity: number) {
    // TODO: Consider passing the map as a parameter instead of using inject
    const olMap = toValue(inject<Map>('olMap'))
    const drawingStore = useDrawingStore()
    register(proj4)
    // Track the currently selected icon for new point features
    const selectedIcon = ref<MarkerIcon>(DEFAULT_MARKER_ICON!)

    if (!olMap) {
        log.error('OpenLayersMap is not available')
        throw new Error('OpenLayersMap is not available')
    }

    const source = new VectorSource({
        wrapX: false,
    })

    // Style function that handles both regular features and text features
    const styleFunction = (feature: Feature<Geometry>): StyleLike => {
        const textContent = feature.get('text')
        if (textContent) {
            return createTextFeatureStyle(textContent)
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
                        anchor: icon.anchor, // Use icon-specific anchor point
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
            style: styleFunction as StyleFunction,
        })
        // Use markRaw to prevent Vue from making this reactive (huge performance improvement)
        drawingStore.setOlLayer(markRaw(olLayer))
        return olLayer
    }

    let currentDraw: Draw | null = null
    const layer = createOlLayer(layerId, uuid)
    // Add layer to map immediately
    olMap.addLayer(layer)
    log.debug(`Added drawing layer ${layerId} to map`)

    onBeforeUnmount(() => {
        stopDrawing()
        olMap.removeLayer(layer)
    })

    /**
     * Start drawing with the specified geometry type
     */
    function startDrawing(
        type: DrawingMode,
        onFeatureAdded?: (feature: Feature<Geometry>) => void
    ) {
        // Stop any existing draw interaction first
        stopDrawing()

        addDrawingInteraction(type, onFeatureAdded)

        log.debug(`Started drawing ${type}, interaction added to map`)
    }

    function addDrawingInteraction(
        type: DrawingMode,
        onFeatureAdded?: (feature: Feature<Geometry>) => void
    ) {
        // For text, we use Point geometry
        const geometryType = type === 'Text' ? 'Point' : type

        currentDraw = new Draw({
            source,
            type: geometryType as Type,
        })
        currentDraw.on('drawend', (event) => {
            log.debug(`Feature drawn: ${type}`, event.feature)

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

        olMap!.addInteraction(currentDraw)
    }

    /**
     * Stop the current drawing interaction
     */
    function stopDrawing() {
        if (currentDraw) {
            currentDraw.setActive(false) // Deactivate first
            olMap!.removeInteraction(currentDraw)
            currentDraw = null
            log.debug('Stopped drawing and removed interaction from map')
        } else {
            log.info({
                title: 'olDrawing Composable / stopDrawing',
                titleColor: LogPreDefinedColor.Yellow,
                messages: [`No draw interaction to remove`],
            })
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
