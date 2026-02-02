import type { Feature } from 'ol'
import type { Geometry } from 'ol/geom'

import { LayerType, useLayerStore } from '@swissgeo/layers'
import log from '@swissgeo/log'

import { useDrawingStore } from '@/stores/drawing'

export const DRAWING_LAYER_ID = 'user-drawing-layer'
const DRAWING_KML_LAYER_ID = 'user-drawing-layer-kml'
const DRAWING_LAYER_NAME = 'My Drawings'
const DRAWING_KML_LAYER_NAME = 'My Drawings KML'

/**
 * Composable for managing drawing layer lifecycle in the layer store
 * Handles app-specific layer operations and file downloads
 */
export function useDrawingManager() {
    const layerStore = useLayerStore()
    const drawingStore = useDrawingStore()

    /**
     * Create the temporary drawing layer
     */
    function createDrawingLayer() {
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
        return config
    }

    /**
     * Create the persistent KML layer from drawing features
     */
    function createKMLLayer() {
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
     * Start drawing mode
     */
    function startDrawing() {
        // Remove any existing KML layer
        if (drawingStore.drawingKMLLayerUuid) {
            layerStore.removeLayer(drawingStore.drawingKMLLayerUuid)
        }

        // Create or reuse drawing layer
        const existingLayer = layerStore.layers.find(
            (layer) => layer.uuid === drawingStore.drawingLayerUuid
        )

        if (!existingLayer) {
            createDrawingLayer()
        }

        if (!drawingStore.isDrawing) {
            drawingStore.toggleDrawing()
        }

        log.debug('Started drawing mode')
    }

    /**
     * Stop drawing mode and persist as KML layer
     */
    function stopDrawing() {
        if (drawingStore.isDrawing) {
            drawingStore.toggleDrawing()
        }

        // Create persistent KML layer if we have features
        if (drawingStore.drawingFeatures.length > 0) {
            const kmlLayer = createKMLLayer()
            drawingStore.setDrawingKMLLayerUuid(kmlLayer.uuid)
            layerStore.addLayer(kmlLayer)
        }

        // Remove temporary drawing layer
        if (drawingStore.drawingLayerUuid) {
            layerStore.removeLayer(drawingStore.drawingLayerUuid)
        }

        drawingStore.clearDrawingMode()
        log.debug('Stopped drawing mode')
    }

    /**
     * Clear all drawings
     */
    function clearDrawing() {
        drawingStore.clearDrawingMode()
        drawingStore.clearDrawingFeatures()
        log.debug('Cleared all drawings')
    }

    /**
     * Download file helper
     */
    function downloadFile(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    /**
     * Export and download as KML
     */
    function downloadKML() {
        const blob = drawingStore.exportToKML()
        downloadFile(blob, 'drawing.kml')
    }

    /**
     * Export and download as KMZ
     */
    async function downloadKMZ() {
        const blob = await drawingStore.exportToKMZ()
        downloadFile(blob, 'drawing.kmz')
    }

    /**
     * Export and download as GPX
     */
    function downloadGPX() {
        const blob = drawingStore.exportToGPX()
        downloadFile(blob, 'drawing.gpx')
    }

    return {
        startDrawing,
        stopDrawing,
        clearDrawing,
        downloadKML,
        downloadKMZ,
        downloadGPX,
    }
}
