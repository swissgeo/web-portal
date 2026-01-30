import type { Feature } from "ol"
import type { Geometry } from "ol/geom"
import type VectorLayer from 'ol/layer/Vector'

import { registerProj4 } from '@swissgeo/coordinates'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { zip } from 'fflate'
import GPX from 'ol/format/GPX'
import KML from 'ol/format/KML'
import { register } from "ol/proj/proj4"
import { Fill, Icon, Stroke, Style } from 'ol/style'
import proj4 from 'proj4'

import { EPSG_4326_WGS84, EPSG_2056_CH1903 } from '@/constants/projections'
import { DEFAULT_MARKER_ICON, getMarkerIconById, MARKER_ICONS, dataUrlToUint8Array } from '@/utils/markerIcons'

// Register proj4 definitions and with OpenLayers at module load time
// This defines EPSG:2056 and other Swiss coordinate systems in proj4
// and makes them available to OpenLayers for transformations
registerProj4(proj4)
register(proj4)

export enum DrawingMode {
    None = 'None',
    Point = 'Point',
    LineString = 'LineString',
    Polygon = 'Polygon',
    Text = 'Text'
}

const DRAWING_LAYER_NAME = 'My Drawings'

export const useDrawingStore = defineStore('drawing', () => {
    const drawingMode = ref<DrawingMode>(DrawingMode.None)

    const isDrawing = ref(false)
    const drawingLayerUuid = ref<string | undefined>(undefined)
    const drawingKMLLayerUuid = ref<string | undefined>(undefined)
    const drawingFeatures = ref<Feature<Geometry>[]>([])
    const featureCount = computed(() => drawingFeatures.value.length)
    const selectedIconId = ref<string>(DEFAULT_MARKER_ICON!.id)
    const olLayer = shallowRef<VectorLayer | undefined>(undefined)

    // State mutations
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

    // KML generation
    function generateEmptyKML(): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
                <kml xmlns="http://www.opengis.net/kml/2.2">
                <Document>
                    <name>${DRAWING_LAYER_NAME}</name>
                    <description>User drawings</description>
                </Document>
                </kml>`
    }

    function featuresToKML(features: Feature<Geometry>[]): string {
        if (features.length === 0) {
            return generateEmptyKML()
        }

        const format = new KML({
            extractStyles: true,
        })

        const clonedFeatures = features.map(feature => {
            const clone = feature.clone()

            const textContent = feature.get('text')
            if (textContent) {
                clone.set('name', textContent)
                clone.set('text', textContent)
            }

            const iconId = feature.get('iconId')
            const geomType = feature.getGeometry()?.getType()

            if (geomType === 'Point' && iconId) {
                const icon = getMarkerIconById(iconId)
                if (icon) {
                    const iconStyle = new Style({
                        image: new Icon({
                            src: icon.dataUrl,
                            scale: 1,
                            anchor: icon.anchor,
                            anchorXUnits: 'fraction',
                            anchorYUnits: 'fraction',
                        }),
                    })
                    clone.setStyle(iconStyle)
                    clone.set('iconId', iconId)
                }
            } else {
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
                geom.transform(EPSG_2056_CH1903, EPSG_4326_WGS84)
            }
            return clone
        })

        return format.writeFeatures(clonedFeatures, {
            featureProjection: EPSG_4326_WGS84,
            dataProjection: EPSG_4326_WGS84,
        })
    }

    // Export functions (moved from manager)
    function exportToKML(): Blob {
        const kmlString = featuresToKML(drawingFeatures.value as Feature<Geometry>[])
        return new Blob([kmlString], { type: 'application/vnd.google-earth.kml+xml' })
    }

    async function exportToKMZ(): Promise<Blob> {
        const kmlString = featuresToKML(drawingFeatures.value as Feature<Geometry>[])

        // Collect unique icon IDs
        const usedIconIds = new Set<string>()
        drawingFeatures.value.forEach(feature => {
            const iconId = feature.get('iconId')
            if (iconId) {
                usedIconIds.add(iconId)
            }
        })

        // If no icons, return simple KMZ
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

        // Replace data URLs with file references
        let modifiedKML = kmlString
        MARKER_ICONS.forEach((icon) => {
            if (usedIconIds.has(icon.id)) {
                modifiedKML = modifiedKML.split(icon.dataUrl).join(`icons/${icon.id}.svg`)
            }
        })

        const kmlData = new TextEncoder().encode(modifiedKML)
        const files: Record<string, Uint8Array> = { 'doc.kml': kmlData }

        // Add icon files
        for (const iconId of usedIconIds) {
            const icon = MARKER_ICONS.find((icon) => icon.id === iconId)
            if (icon) {
                try {
                    const iconData = await dataUrlToUint8Array(icon.dataUrl)
                    files[`icons/${icon.id}.svg`] = iconData
                } catch (error) {
                    log.error({
                        title: 'drawing store / exportToKMZ',
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
                    resolve(new Blob([new Uint8Array(data)], { type: 'application/vnd.google-earth.kmz' }))
                }
            })
        })
    }

    function exportToGPX(): Blob {
        // Filter valid features for GPX
        const validFeatures = drawingFeatures.value.filter(f => {
            const geomType = f.getGeometry()?.getType()
            const isText = f.get('text')
            return !isText && (geomType === 'Point' || geomType === 'LineString' || geomType === 'MultiLineString')
        })

        if (validFeatures.length === 0) {
            const emptyGPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SwissGeo Portal" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
</gpx>`
            return new Blob([emptyGPX], { type: 'application/gpx+xml' })
        }

        const format = new GPX()

        const clonedFeatures = validFeatures.map(feature => {
            const clone = feature.clone()
            const geom = clone.getGeometry()
            if (geom) {
                geom.transform(EPSG_2056_CH1903, EPSG_4326_WGS84)
            }
            return clone
        })

        const gpxString = format.writeFeatures(clonedFeatures, {
            featureProjection: EPSG_4326_WGS84,
            dataProjection: EPSG_4326_WGS84,
        })

        return new Blob([gpxString], { type: 'application/gpx+xml' })
    }

    return {
        // State
        olLayer,
        featureCount,
        drawingLayerUuid,
        drawingKMLLayerUuid,
        drawingFeatures,
        isDrawing,
        drawingMode,
        selectedIconId,

        // Mutations
        addDrawingFeature,
        setDrawingMode,
        clearDrawingMode,
        toggleDrawing,
        setDrawingLayerUuid,
        clearDrawingFeatures,
        setOlLayer,
        setDrawingKMLLayerUuid,
        setSelectedIconId,

        // Operations
        generateEmptyKML,
        featuresToKML,
        exportToKML,
        exportToKMZ,
        exportToGPX,
    }
})
