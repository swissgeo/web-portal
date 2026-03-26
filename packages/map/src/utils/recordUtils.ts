import type {
    GeoJSONLayer,
    GPXLayer,
    KMLLayer,
    KMZLayer,
    Layer,
    VectorLayer,
    WMSLayer,
    WMTSLayer,
} from '@/types'

// maybe this belongs to shared?

export const isWMTS = (layer: Layer): layer is WMTSLayer => layer.format === 'WMTS'
export const isWMS = (layer: Layer): layer is WMSLayer => layer.format === 'WMS'
export const isKML = (layer: Layer): layer is KMLLayer => layer.format === 'KML'
export const isKMZ = (layer: Layer): layer is KMZLayer => layer.format === 'KMZ'
export const isGPX = (layer: Layer): layer is GPXLayer => layer.format === 'GPX'
export const isGeoJSON = (layer: Layer): layer is GeoJSONLayer => layer.format === 'GeoJSON'
export const isVector = (layer: Layer): layer is VectorLayer => layer.format === 'Vector'
