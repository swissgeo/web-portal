import type { Feature } from "ol"
import type { Geometry } from "ol/geom"
import type VectorLayer from 'ol/layer/Vector'

import { useLayerStore } from "@swissgeo/layers"
import log from '@swissgeo/log'
import KML from 'ol/format/KML'
import { register } from "ol/proj/proj4"
import proj4 from 'proj4'
export enum DrawingMode {
    None = 'none',
    Point = 'point',
    LineString = 'linestring',
    Polygon = 'polygon'
}

const DRAWING_LAYER_ID = 'user-drawing-layer'
const DRAWING_LAYER_NAME = 'My Drawings'
export const useDrawingStore = defineStore('drawingStore', () => {
    const drawingMode = ref<DrawingMode>(DrawingMode.None)
    const layerStore = useLayerStore()

    const isDrawing = ref(false)
    const drawingLayerUuid = ref<string | undefined>(undefined)
    const drawingKMLLayerUuid = ref<string | undefined>(undefined)
    const drawingFeatures = ref<Feature<Geometry>[]>([])
    const featureCount = computed(() => drawingFeatures.value.length)
    // Use shallowRef to prevent Vue from deeply observing OpenLayers objects
    const olLayer = shallowRef<VectorLayer | undefined>(undefined)
    function setDrawingMode(mode: DrawingMode) {
        drawingMode.value = mode
    }

    function clearDrawingMode() {
        drawingMode.value = DrawingMode.None
        // drawingLayerUuid.value = undefined
    }

    function toggleDrawing() {
        isDrawing.value = !isDrawing.value
    }

    function addDrawingFeature(feature: Feature<Geometry>) {
        drawingFeatures.value.push(feature)
    }

    function setDrawingLayerUuid(uuid: string) {
        drawingLayerUuid.value = uuid
    }
    function setDrawingKMLLayerUuid(uuid: string) {
        drawingKMLLayerUuid.value = uuid
    }

    function clearDrawingFeatures() {
        drawingFeatures.value = []
    }

    function setOlLayer(layer: any) {
        olLayer.value = layer
    }

    function generateEmptyKML(): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${DRAWING_LAYER_NAME}</name>
    <description>User drawings</description>
  </Document>
</kml>`
    }

    function updateDrawingLayer(features: Feature<Geometry>[]) {
        console.log('Updating drawing layer with features:', features)
        const layer = layerStore.layers.find((l) => l.uuid === drawingLayerUuid.value)
        if (!layer) {
            return
        }

        // Defer KML conversion to avoid blocking the UI
        requestAnimationFrame(() => {
            const kmlData = featuresToKML(features)
            // Update the layer's file data
            // @ts-expect-error - we know this is a FileLayer
            layer.fileData = kmlData

            log.debug(`Updated drawing layer with ${features.length} features`)
        })
    }

    function featuresToKML(features: Feature<Geometry>[]): string {
        if (features.length === 0) {
            return generateEmptyKML()
        }

        register(proj4)
        const format = new KML({
            extractStyles: false, // Disable style extraction for better performance
        })

        // Clone features and transform to WGS84
        const clonedFeatures = features.map(feature => {
            const clone = feature.clone()
            const geom = clone.getGeometry()
            if (geom) {
                geom.transform('EPSG:2056', 'EPSG:4326')
            }
            return clone
        })

        const kmlString = format.writeFeatures(clonedFeatures, {
            featureProjection: 'EPSG:4326', // Already transformed to WGS84
            dataProjection: 'EPSG:4326', // WGS84
        })

        return kmlString
    }

    return {
        olLayer,
        featureCount,
        drawingLayerUuid,
        drawingKMLLayerUuid,
        drawingFeatures,
        isDrawing,
        drawingMode,
        addDrawingFeature,
        setDrawingMode,
        clearDrawingMode,
        toggleDrawing,
        setDrawingLayerUuid,
        clearDrawingFeatures,
        setOlLayer,
        updateDrawingLayer,
        generateEmptyKML,
        featuresToKML,
        setDrawingKMLLayerUuid
    }
})

export default useDrawingStore