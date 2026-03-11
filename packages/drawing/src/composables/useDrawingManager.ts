import type { FileLayer, Layer } from '@swissgeo/layers'
import type { Feature } from 'ol'
import type { Geometry } from 'ol/geom'

import { useLayerStore } from '@swissgeo/layers'
import log from '@swissgeo/log'
import { DRAWING_KML_LAYER_ID, DRAWING_LAYER_ID } from '@swissgeo/shared'

import { useDrawingStore } from '@/stores/drawing'
import {
    createEmptyDrawingKML,
    exportFeaturesToGPXBlob,
    exportFeaturesToKMLBlob,
    exportFeaturesToKMZBlob,
    serializeFeaturesToKML,
} from '@/utils/drawingUtils'

const DRAWING_ABSTRACT = 'User-created drawings on the map'

function toFileSafeName(value: string): string {
    const normalized = value
        .trim()
        .replaceAll(/[^a-zA-Z0-9-_ ]/g, '')
        .replaceAll(/\s+/g, '_')

    return normalized.length > 0 ? normalized : 'drawing'
}

/**
 * Composable for managing drawing layer lifecycle in the layer store
 * Handles app-specific layer operations and file downloads
 */
export function useDrawingManager() {
    const resolveFeatureContext = () => ({
        drawingMode: drawingStore.drawingMode,
        measurementSubtype: drawingStore.measurementSubtype,
    })

    const layerStore = useLayerStore()
    const drawingStore = useDrawingStore()

    /**
     * Create the temporary drawing layer
     */
    function createDrawingLayer() {
        const uuid = crypto.randomUUID()
        const config: FileLayer = {
            uuid,
            humanId: DRAWING_LAYER_ID,
            opacity: 1,
            isVisible: true,
            type: 'kml',
            isLoading: false,
            info: {
                displayName: drawingStore.drawingName,
                abstract: DRAWING_ABSTRACT,
            },
            fileData: createEmptyDrawingKML(drawingStore.drawingName),
        }

        layerStore.addLayer(config)
        drawingStore.setDrawingLayerUuid(uuid)
        return config
    }

    /**
     * Create the persistent KML layer from drawing features
     */
    function createKMLLayer(): FileLayer {
        const config: FileLayer = {
            uuid: crypto.randomUUID(),
            humanId: DRAWING_KML_LAYER_ID,
            opacity: 1,
            isVisible: true,
            type: 'kml',
            isLoading: false,
            info: {
                displayName: drawingStore.drawingName,
                abstract: DRAWING_ABSTRACT,
            },
            fileData: serializeFeaturesToKML(
                drawingStore.drawingFeatures as Feature<Geometry>[],
                drawingStore.drawingName,
                resolveFeatureContext()
            ),
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
            (layer: Layer) => layer.uuid === drawingStore.drawingLayerUuid
        )

        if (!existingLayer) {
            createDrawingLayer()
        } else {
            layerStore.moveLayerToTop(existingLayer.uuid)
        }

        if (!drawingStore.isDrawing) {
            drawingStore.toggleDrawing()
        }
        console.log('Started drawing mode', drawingStore.isDrawing)
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
            const kmlLayer: FileLayer = createKMLLayer()
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
        const blob = exportFeaturesToKMLBlob(
            drawingStore.drawingFeatures as Feature<Geometry>[],
            drawingStore.drawingName,
            resolveFeatureContext()
        )
        downloadFile(blob, `${toFileSafeName(drawingStore.drawingName)}.kml`)
    }

    /**
     * Export and download as KMZ
     */
    async function downloadKMZ() {
        const blob = await exportFeaturesToKMZBlob(
            drawingStore.drawingFeatures as Feature<Geometry>[],
            drawingStore.drawingName,
            resolveFeatureContext()
        )
        downloadFile(blob, `${toFileSafeName(drawingStore.drawingName)}.kmz`)
    }

    /**
     * Export and download as GPX
     */
    function downloadGPX() {
        const blob = exportFeaturesToGPXBlob(
            drawingStore.drawingFeatures as Feature<Geometry>[],
            drawingStore.drawingName
        )
        downloadFile(blob, `${toFileSafeName(drawingStore.drawingName)}.gpx`)
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
