import type { GeoAdminGeoJSONStyleDefinition } from '@swissgeo/shared/geojson'
import type { Options as WMTSOptions } from 'ol/source/WMTS'
import type { Component } from 'vue'

import type { FeatureCollectionWithCRS } from '@/utils/geoJsonUtils'

/**
 * At the moment, these 3 types are sort of like a duplicate of layers.
 * Maybe we'll figure out a way to share these types, but maybe it also makes
 * sense that each package defines it's type expecations encapsulated
 */
export interface Dimension {
    currentValue: string | null
    availableValues: string[]
}

export type DimensionId = 'time'

export type DimensionRecord = Partial<Record<DimensionId, Dimension>>

export type LayerFormat = 'WMTS' | 'WMS' | 'GeoJSON' | 'KML' | 'KMZ' | 'GPX' | 'Vector'

export interface Layer {
    format: LayerFormat
    layerId: string
    uuid: string
    opacity: number
    isVisible: boolean
    zIndex: number
}

export interface WMTSLayer extends Layer {
    format: 'WMTS'
    options: WMTSOptions
    dimensions: DimensionRecord
}

export interface WMSLayer extends Layer {
    format: 'WMS'
    dimensions: DimensionRecord
    gutter: number
    url: string
    version: string
    lang: string
}

export interface KMLLayer extends Layer {
    format: 'KML'
    data: string
}

export interface KMZLayer extends Layer {
    format: 'KMZ'
    data: string
}

export interface GPXLayer extends Layer {
    format: 'GPX'
    data: string
}

export interface GeoJSONLayer extends Layer {
    format: 'GeoJSON'
    geoJsonData: FeatureCollectionWithCRS
    geoJsonStyle?: GeoAdminGeoJSONStyleDefinition
}

export interface VectorLayer extends Layer {
    format: 'Vector'
    data: string
}

export interface MapLayerRenderer {
    matches: (layer: Layer) => boolean
    component: Component
}
