import type {
    DrawingFeatureKindValue as SharedDrawingFeatureKind,
    TextAnchor as SharedTextAnchor,
} from '@swissgeo/shared'

export type DrawingMode = 'None' | 'Point' | 'LineString' | 'Polygon' | 'Text' | 'Measurement'

export type MeasurementDrawingSubtype = 'Radius' | 'Path'

export type DrawingFeatureKind = SharedDrawingFeatureKind

export type TextAnchor = SharedTextAnchor

export interface DrawingPointStyleProps {
    iconId?: string
    iconColor?: string
    iconSize?: number
}

export interface DrawingTextStyleProps {
    textColor?: string
    textSize?: number
    textAnchor?: TextAnchor
}

export interface DrawingLineStyleProps {
    strokeColor?: string
    strokeWidth?: number
    strokeOpacity?: number
    dashPattern?: number[]
}

export interface DrawingPolygonStyleProps extends DrawingLineStyleProps {
    fillColor?: string
    fillOpacity?: number
}

export interface DrawingMeasurementStyleProps extends DrawingLineStyleProps {
    intervalKilometers?: number
    labelColor?: string
    labelSize?: number
}

export type DrawingFeatureStyleProps =
    | DrawingPointStyleProps
    | DrawingTextStyleProps
    | DrawingLineStyleProps
    | DrawingPolygonStyleProps
    | DrawingMeasurementStyleProps

export interface DrawingFeatureMetadata {
    title: string
    description: string
    isDescriptionVisible: boolean
    isVisible: boolean
}

export interface DrawingFeatureAttributes extends DrawingFeatureMetadata {
    kind: DrawingFeatureKind
    style: DrawingFeatureStyleProps
    measurementSubtype?: MeasurementDrawingSubtype
}

export interface DrawingFeatureInfoPayload {
    featureId: string
    kind: DrawingFeatureKind
    title: string
    description: string
    text: string
    geometryType: string
    coordinate?: number[]
    area?: number
    perimeter?: number
}

export interface DrawingHoverHintPayload {
    x: number
    y: number
    text: string
}
