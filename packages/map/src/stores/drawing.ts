import type { Feature } from "ol"
import type { Geometry } from "ol/geom"
import type VectorLayer from 'ol/layer/Vector'

import { useLayerStore } from "@swissgeo/layers"
import log from '@swissgeo/log'
import KML from 'ol/format/KML'
import { register } from "ol/proj/proj4"
import { Fill, Icon, Stroke, Style } from 'ol/style'
import proj4 from 'proj4'

import { DEFAULT_MARKER_ICON, getMarkerIconById } from '@/utils/markerIcons'
export enum DrawingMode {
    None = 'None',
    Point = 'Point',
    LineString = 'LineString',
    Polygon = 'Polygon',
    Text = 'Text'
}

const DRAWING_LAYER_NAME = 'My Drawings'
export const useDrawingStore = defineStore('drawingStore', () => {
    const drawingMode = ref<DrawingMode>(DrawingMode.None)
    const layerStore = useLayerStore()

    const isDrawing = ref(false)
    const drawingLayerUuid = ref<string | undefined>(undefined)
    const drawingKMLLayerUuid = ref<string | undefined>(undefined)
    const drawingFeatures = ref<Feature<Geometry>[]>([])
    const featureCount = computed(() => drawingFeatures.value.length)
    const selectedIconId = ref<string>(DEFAULT_MARKER_ICON!.id)
    // Use shallowRef to prevent Vue from deeply observing OpenLayers objects
    const olLayer = shallowRef<VectorLayer | undefined>(undefined)
    function setDrawingMode(mode: DrawingMode) {
        drawingMode.value = mode
    }

    function clearDrawingMode() {
        drawingMode.value = DrawingMode.None
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

    function setOlLayer(layer: VectorLayer) {
        olLayer.value = layer
    }

    function setSelectedIconId(iconId: string) {
        selectedIconId.value = iconId
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
            extractStyles: true, // Enable style extraction to embed styles in KML
        })

        // Clone features, apply style, and transform to WGS84
        const clonedFeatures = features.map(feature => {
            const clone = feature.clone()

            // Check if this is a text feature
            const textContent = feature.get('text')
            if (textContent) {
                // Set the name property for KML (this will show in Google Earth etc.)
                clone.set('name', textContent)
                // Keep the text property for reimporting
                clone.set('text', textContent)
            }

            // Check if this is a point with an icon
            const iconId = feature.get('iconId')
            const geomType = feature.getGeometry()?.getType()

            if (geomType === 'Point' && iconId) {
                const icon = getMarkerIconById(iconId)
                if (icon) {
                    // Create icon style
                    const iconStyle = new Style({
                        image: new Icon({
                            src: icon.dataUrl,
                            scale: 1,
                            anchor: [0.5, 1],
                            anchorXUnits: 'fraction',
                            anchorYUnits: 'fraction',
                        }),
                    })
                    clone.setStyle(iconStyle)

                    // Store icon ID for reimport
                    clone.set('iconId', iconId)
                }
            } else {
                // Regular feature styling for lines and polygons
                const drawingStyle = new Style({
                    fill: new Fill({
                        color: 'rgba(255, 0, 0, 0.2)',
                    }),
                    stroke: new Stroke({
                        color: '#ff0000',
                        width: 2,
                    }),
                })
                clone.setStyle(drawingStyle)
            }

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
        selectedIconId,
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
        setDrawingKMLLayerUuid,
        setSelectedIconId,
    }
})

export default useDrawingStore