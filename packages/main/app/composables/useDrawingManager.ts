import type { MarkerIcon } from '@swissgeo/map'
import type { Feature } from 'ol'
import type { Geometry } from 'ol/geom'

import { LayerType, useLayerStore } from '@swissgeo/layers'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { useDrawingStore, markerIcons, PROJECTION_EPSG } from '@swissgeo/map'
import { zip } from 'fflate'
import GPX from 'ol/format/GPX'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'
const { dataUrlToUint8Array, MARKER_ICONS } = markerIcons

const DRAWING_LAYER_ID = 'user-drawing-layer'
const DRAWING_KML_LAYER_ID = 'user-drawing-layer-kml'
const DRAWING_LAYER_NAME = 'My Drawings'
const DRAWING_KML_LAYER_NAME = 'My Drawings KML'

/**
 * Composable for managing drawing functionality and layer persistence
 * This is a singleton - state is shared across all instances
 */
export function useDrawingManager() {
    const layerStore = useLayerStore()
    const drawingStore = useDrawingStore()

    /**
     * Get or create the drawing layer
     */
    function getOrCreateDrawingLayer() {
        // Check if drawing layer already exists
        const existingLayer = layerStore.layers.find(
            (layer) => layer.uuid === drawingStore.drawingLayerUuid
        )

        if (existingLayer) {
            drawingStore.setDrawingLayerUuid(existingLayer.uuid)
            return existingLayer
        }

        // Create new drawing layer
        const uuid = crypto.randomUUID()
        const config = {
            uuid,
            humanId: DRAWING_LAYER_ID,
            opacity: 1,
            isVisible: true,
            type: LayerType.KML,
            isLoading: false,
            zIndex: layerStore.greatestZIndex + 1,
            info: {
                displayName: DRAWING_LAYER_NAME,
                abstract: 'User-created drawings on the map',
            },
            fileData: drawingStore.generateEmptyKML(),
        }

        layerStore.addLayer(config)
        drawingStore.setDrawingLayerUuid(uuid)
        log.debug('Created new drawing layer')
        return config
    }

    /**
     * Start drawing with specified type
     */
    function startDrawing() {
        layerStore.removeLayer(drawingStore.drawingKMLLayerUuid)

        getOrCreateDrawingLayer()
        if (!drawingStore.isDrawing) {
            drawingStore.toggleDrawing()
        }
        log.debug(`Started drawing`)
    }

    /**
     * Stop drawing
     */
    function stopDrawing() {
        if (drawingStore.isDrawing) {
            drawingStore.toggleDrawing()
        }
        drawingStore.updateDrawingLayer(drawingStore.drawingFeatures as Feature<Geometry>[])
        if (drawingStore.drawingFeatures.length) {
            const kmlLayerFromDrawing = createKMLLayerFromDrawingFeatures()
            drawingStore.setDrawingKMLLayerUuid(kmlLayerFromDrawing.uuid)
            layerStore.addLayer(kmlLayerFromDrawing)
        }
        layerStore.removeLayer(drawingStore.drawingLayerUuid)

        log.debug('Stopped drawing mode')
        drawingStore.clearDrawingMode()

    }

    function createKMLLayerFromDrawingFeatures() {
        const config = {
            uuid: crypto.randomUUID(),
            humanId: DRAWING_KML_LAYER_ID,
            opacity: 1,
            isVisible: true,
            type: LayerType.KML,
            isLoading: false,
            zIndex: layerStore.greatestZIndex + 1,
            info: {
                displayName: DRAWING_KML_LAYER_NAME,
                abstract: 'User-created drawings on the map',
            },
            fileData: drawingStore.featuresToKML(drawingStore.drawingFeatures as Feature<Geometry>[]),
        }
        return config
    }

    /**
     * Clear all drawings
     */
    function clearDrawing() {
        drawingStore.clearDrawingMode()
        drawingStore.clearDrawingFeatures()
        drawingStore.updateDrawingLayer([])
        log.debug('Cleared all drawings')
    }

    /**
     * Export drawings to KML format
     */
    function exportToKML(): Promise<Blob> {
        const features = drawingStore.drawingFeatures as Feature<Geometry>[]
        const kmlString = drawingStore.featuresToKML(features)
        return Promise.resolve(new Blob([kmlString], { type: 'application/vnd.google-earth.kml+xml' }))
    }

    /**
     * Export drawings to KMZ format (zipped KML with embedded icons)
     */
    async function exportToKMZ(): Promise<Blob> {
        const features = drawingStore.drawingFeatures as Feature<Geometry>[]
        const kmlString = drawingStore.featuresToKML(features)

        // Collect unique icon IDs used in features
        const usedIconIds = new Set<string>()
        features.forEach(feature => {
            const iconId = feature.get('iconId')
            if (iconId) {
                usedIconIds.add(iconId)
            }
        })

        // If no icons are used, just export basic KMZ
        if (usedIconIds.size === 0) {
            const kmlData = new TextEncoder().encode(kmlString)
            return new Promise((resolve, reject) => {
                zip({ 'doc.kml': kmlData }, { level: 6 }, (err, data) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(new Blob([new Uint8Array(data)], { type: 'application/vnd.google-earth.kmz' }))
                    }
                })
            })
        }

        // Replace data URLs with local file references in KML
        // We need to be more careful with the replacement to handle KML format
        let modifiedKML = kmlString
        const replacements: Array<{ from: string; to: string }> = []

        MARKER_ICONS.forEach((icon: MarkerIcon) => {
            if (usedIconIds.has(icon.id)) {
                replacements.push({
                    from: icon.dataUrl,
                    to: `icons/${icon.id}.svg`
                })
            }
        })

        // Perform replacements
        replacements.forEach(({ from, to }) => {
            modifiedKML = modifiedKML.split(from).join(to)
        })

        const kmlData = new TextEncoder().encode(modifiedKML)

        // Create files object for ZIP
        const files: Record<string, Uint8Array> = {
            'doc.kml': kmlData
        }

        // Add icon files to ZIP (only those that are used)
        for (const iconId of usedIconIds) {
            const icon = MARKER_ICONS.find((icon: MarkerIcon) => icon.id === iconId)
            if (icon) {
                try {
                    // Extract SVG data from data URL
                    const iconData = await dataUrlToUint8Array(icon.dataUrl)
                    files[`icons/${icon.id}.svg`] = iconData
                } catch (error) {
                    log.error({
                        title: 'useDrawingManager / exportToKMZ',
                        titleColor: LogPreDefinedColor.Red,
                        messages: [`Failed to add icon ${icon.id} to KMZ:`, error],
                    })
                }
            }
        }

        return new Promise((resolve, reject) => {
            zip(files, { level: 6 }, (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    // Convert to standard Uint8Array
                    const result = new Uint8Array(data)
                    resolve(new Blob([result], { type: 'application/vnd.google-earth.kmz' }))
                }
            })
        })
    }

    /**
     * Export drawings to GPX format
     */
    function exportToGPX(): Promise<Blob> {
        const features = drawingStore.drawingFeatures as Feature<Geometry>[]

        // GPX only supports certain geometry types (Point, LineString)
        // Filter out polygons and text features
        const validFeatures = features.filter(f => {
            const geomType = f.getGeometry()?.getType()
            const isText = f.get('text')
            return !isText && (geomType === 'Point' || geomType === 'LineString' || geomType === 'MultiLineString')
        })

        if (validFeatures.length === 0) {
            // Return a minimal valid GPX file when there are no valid features
            const emptyGPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SwissGeo Portal" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
</gpx>`
            return Promise.resolve(new Blob([emptyGPX], { type: 'application/gpx+xml' }))
        }

        register(proj4)
        const format = new GPX()

        // Clone features and transform to WGS84 (similar to KML export)
        const clonedFeatures = validFeatures.map(feature => {
            const clone = feature.clone()
            const geom = clone.getGeometry()
            if (geom) {
                geom.transform(PROJECTION_EPSG.EPSG_2056_CH1903, PROJECTION_EPSG.EPSG_4326_WGS84) // Transform from CH1903+ to WGS84
            }
            return clone
        })

        const gpxString = format.writeFeatures(clonedFeatures, {
            featureProjection: PROJECTION_EPSG.EPSG_4326_WGS84, // Already transformed to WGS84
            dataProjection: PROJECTION_EPSG.EPSG_4326_WGS84, // WGS84 (required for GPX)
        })

        return Promise.resolve(new Blob([gpxString], { type: 'application/gpx+xml' }))
    }

    return {
        startDrawing,
        stopDrawing,
        clearDrawing,
        exportToKML,
        exportToKMZ,
        exportToGPX,
    }
}
