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

export const isWMTS = (layer: Layer): layer is WMTSLayer => layer.type === 'WMTS'
export const isWMS = (layer: Layer): layer is WMSLayer => layer.type === 'WMS'
export const isKML = (layer: Layer): layer is KMLLayer => layer.type === 'KML'
export const isKMZ = (layer: Layer): layer is KMZLayer => layer.type === 'KMZ'
export const isGPX = (layer: Layer): layer is GPXLayer => layer.type === 'GPX'
export const isGeoJSON = (layer: Layer): layer is GeoJSONLayer => layer.type === 'GeoJSON'
export const isVector = (layer: Layer): layer is VectorLayer => layer.type === 'Vector'
