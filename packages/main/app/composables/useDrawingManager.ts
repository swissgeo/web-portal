import type { Feature, Map } from 'ol'
import type { Geometry } from 'ol/geom'
import type VectorLayer from 'ol/layer/Vector'
import type VectorSource from 'ol/source/Vector'

import { LayerType, useLayerStore } from '@swissgeo/layers'
import log from '@swissgeo/log'
import { useDrawingStore } from '@swissgeo/map'
import GPX from 'ol/format/GPX'
import KML from 'ol/format/KML'
import { register } from 'ol/proj/proj4'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'
import proj4 from 'proj4'


const DRAWING_LAYER_ID = 'user-drawing-layer'
const DRAWING_KML_LAYER_ID = 'user-drawing-layer-kml'
const DRAWING_LAYER_NAME = 'My Drawings'
const DRAWING_KML_LAYER_NAME = 'My Drawings KML'

// Singleton state
// const drawingLayerUuid = ref<string | null>(null)
// const isDrawing = ref(false)
// const drawingMode = ref<'point' | 'linestring' | 'polygon' | null>(null)
// const featureCount = ref(0)
// const drawingFeatures = ref<Feature<Geometry>[]>([])

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
        // TODO change to use drawingLayerUuid and dont reset it when layer is removed
        const existingLayer = layerStore.layers.find(
            (layer) => layer.humanId === DRAWING_LAYER_ID
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
        // const olLayer = createOlLayer(DRAWING_LAYER_ID, uuid)
        // const drawingLayer = {
        //     config,
        //     olLayer
        // }
        layerStore.addLayer(config)
        // drawingStore.setOlLayer(olLayer)
        drawingStore.setDrawingLayerUuid(uuid)
        log.debug('Created new drawing layer')
        console.log('Created new drawing layer:', config)
        return config
    }



    /**
     * Generate empty KML document
     */
    //     function generateEmptyKML(): string {
    //         return `<?xml version="1.0" encoding="UTF-8"?>
    // <kml xmlns="http://www.opengis.net/kml/2.2">
    //   <Document>
    //     <name>${DRAWING_LAYER_NAME}</name>
    //     <description>User drawings</description>
    //   </Document>
    // </kml>`
    //     }

    /**
     * Convert features to KML string
     */
    // function featuresToKML(features: Feature<Geometry>[]): string {
    //     if (features.length === 0) {
    //         return generateEmptyKML()
    //     }

    //     register(proj4)
    //     const format = new KML({
    //         extractStyles: true,
    //     })

    //     // Clone features and transform to WGS84
    //     const clonedFeatures = features.map(feature => {
    //         const clone = feature.clone()
    //         const geom = clone.getGeometry()
    //         if (geom) {
    //             geom.transform('EPSG:2056', 'EPSG:4326')
    //         }
    //         return clone
    //     })

    //     const kmlString = format.writeFeatures(clonedFeatures, {
    //         featureProjection: 'EPSG:4326', // Already transformed to WGS84
    //         dataProjection: 'EPSG:4326', // WGS84
    //     })

    //     return kmlString
    // }

    /**
     * Update the drawing layer with current features
     */
    // function updateDrawingLayer(features: Feature<Geometry>[]) {
    //     const layer = layerStore.layers.find((l) => l.uuid === drawingStore.drawingLayerUuid)
    //     if (!layer) {
    //         return
    //     }

    //     const kmlData = featuresToKML(features)
    //     // Update the layer's file data
    //     // @ts-expect-error - we know this is a FileLayer
    //     layer.fileData = kmlData
    //     // drawingStore.featureCount = features.length

    //     log.debug(`Updated drawing layer with ${features.length} features`)
    // }

    /**
     * Start drawing with specified type
     */
    function startDrawing() {
        layerStore.removeLayer(drawingStore.drawingKMLLayerUuid)

        getOrCreateDrawingLayer()
        // olMap.value.addLayer(drawingStore.olLayer)
        if (!drawingStore.isDrawing) {
            drawingStore.toggleDrawing()
        }
        log.debug(`Started drawing`)
        console.log('Drawing mode started', layerStore.layers.length)
    }

    /**
     * Stop drawing
     */
    function stopDrawing() {
        console.log('Stopping drawing mode', drawingStore.drawingFeatures.length, drawingStore.isDrawing)
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
        // olMap.value.removeLayer(drawingStore.olLayer)
        console.log('Stopping drawing mode end', layerStore.layers, drawingStore.drawingLayerUuid)

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
        console.log('Cleared all drawings', drawingStore.featureCount)
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
     * Export drawings to KMZ format (zipped KML)
     */
    async function exportToKMZ(): Promise<Blob> {
        const features = drawingStore.drawingFeatures as Feature<Geometry>[]
        const kmlString = drawingStore.featuresToKML(features)
        const { zip } = await import('fflate')

        const kmlData = new TextEncoder().encode(kmlString)

        return new Promise((resolve, reject) => {
            zip({ 'doc.kml': kmlData }, { level: 6 }, (err, data) => {
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
        // Filter out polygons or convert them if needed
        const validFeatures = features.filter(f => {
            const geomType = f.getGeometry()?.getType()
            return geomType === 'Point' || geomType === 'LineString' || geomType === 'MultiLineString'
        })

        if (validFeatures.length === 0) {
            console.warn('No valid features for GPX export (only Point and LineString supported)')
        }

        register(proj4)
        const format = new GPX()

        const gpxString = format.writeFeatures(validFeatures, {
            featureProjection: 'EPSG:2056', // CH1903+ / LV95
            dataProjection: 'EPSG:4326', // WGS84
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
