import type { FeatureLike } from 'ol/Feature'
import type StyleType from 'ol/style/Style'
import type { StyleFunction, StyleLike } from 'ol/style/Style'

import LineString from 'ol/geom/LineString'
import MultiPoint from 'ol/geom/MultiPoint'
import Point from 'ol/geom/Point'
import Polygon from 'ol/geom/Polygon'
import { Circle as CircleStyle, Fill, Icon, Stroke, Style, Text as TextStyle } from 'ol/style'

import { createTextFeatureStyle } from './textFeatureStyle'

export type TextAnchor =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'center-left'
    | 'center'
    | 'center-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'

export const DEFAULT_MEASUREMENT_INTERVAL_KILOMETERS = 10
export const DEFAULT_MEASUREMENT_PATH_INTERVAL_KILOMETERS = 100
export const MAX_MEASUREMENT_RADIUS_INTERVALS = 40
export const DRAWING_KML_LAYER_ID = 'user-drawing-layer-kml'

export const STYLE_PROPERTY_KEYS = [
    'iconId',
    'iconColor',
    'iconSize',
    'textColor',
    'textSize',
    'textAnchor',
    'strokeColor',
    'strokeWidth',
    'strokeOpacity',
    'dashPattern',
    'fillColor',
    'fillOpacity',
    'intervalKilometers',
    'labelColor',
    'labelSize',
] as const

export type StylePropertyKey = (typeof STYLE_PROPERTY_KEYS)[number]
export type DrawingFeatureKindValue =
    | 'Point'
    | 'Text'
    | 'LineString'
    | 'Polygon'
    | 'MeasurementRadius'
    | 'MeasurementPath'
    | 'Unknown'

export function toRgbaColor(color: string, opacity: number): string {
    const normalizedOpacity = Math.min(Math.max(opacity, 0), 1)
    const shortHexMatch = color.match(/^#([0-9a-fA-F]{3})$/)
    if (shortHexMatch) {
        const [r, g, b] = shortHexMatch[1]
            .split('')
            .map((value) => Number.parseInt(`${value}${value}`, 16))
        return `rgba(${r}, ${g}, ${b}, ${normalizedOpacity})`
    }

    const longHexMatch = color.match(/^#([0-9a-fA-F]{6})$/)
    if (longHexMatch) {
        const hex = longHexMatch[1]
        const r = Number.parseInt(hex.slice(0, 2), 16)
        const g = Number.parseInt(hex.slice(2, 4), 16)
        const b = Number.parseInt(hex.slice(4, 6), 16)
        return `rgba(${r}, ${g}, ${b}, ${normalizedOpacity})`
    }

    return color
}

export function formatDistanceKilometers(distanceInMeters: number): string {
    return `${(distanceInMeters / 1000).toFixed(2)} km`
}

function normalizeBearing(bearing: number): number {
    const normalized = bearing % 360
    return normalized < 0 ? normalized + 360 : normalized
}

export function bearingBetweenCoordinates(from: number[], to: number[]): number | null {
    const fromX = from[0]
    const fromY = from[1]
    const toX = to[0]
    const toY = to[1]

    if (
        typeof fromX !== 'number' ||
        typeof fromY !== 'number' ||
        typeof toX !== 'number' ||
        typeof toY !== 'number'
    ) {
        return null
    }

    const dx = toX - fromX
    const dy = toY - fromY
    if (dx === 0 && dy === 0) {
        return 0
    }

    const bearingFromNorthClockwise = Math.atan2(dx, dy) * (180 / Math.PI)
    return normalizeBearing(bearingFromNorthClockwise)
}

export function toMeasurementLabelStyle(
    text: string,
    fillColor = '#dc2626',
    textColor = '#ffffff'
) {
    return new TextStyle({
        text,
        font: '600 13px sans-serif',
        fill: new Fill({ color: textColor }),
        backgroundFill: new Fill({ color: fillColor }),
        padding: [4, 8, 4, 8],
        textAlign: 'center',
        textBaseline: 'middle',
        overflow: true,
    })
}

export function resolvePointLabelAnchor(anchor: TextAnchor | undefined) {
    const horizontalOffset = 14
    const verticalOffset = 30
    switch (anchor) {
        case 'top-left':
            return {
                textAlign: 'right' as const,
                offsetX: -horizontalOffset,
                offsetY: -verticalOffset,
            }
        case 'top-center':
            return { textAlign: 'center' as const, offsetX: 0, offsetY: -verticalOffset }
        case 'top-right':
            return {
                textAlign: 'left' as const,
                offsetX: horizontalOffset,
                offsetY: -verticalOffset,
            }
        case 'center-left':
            return { textAlign: 'right' as const, offsetX: -horizontalOffset, offsetY: 0 }
        case 'center':
            return { textAlign: 'center' as const, offsetX: 0, offsetY: 0 }
        case 'center-right':
            return { textAlign: 'left' as const, offsetX: horizontalOffset, offsetY: 0 }
        case 'bottom-left':
            return {
                textAlign: 'right' as const,
                offsetX: -horizontalOffset,
                offsetY: verticalOffset,
            }
        case 'bottom-center':
            return { textAlign: 'center' as const, offsetX: 0, offsetY: verticalOffset }
        case 'bottom-right':
            return {
                textAlign: 'left' as const,
                offsetX: horizontalOffset,
                offsetY: verticalOffset,
            }
        default:
            return { textAlign: 'center' as const, offsetX: 0, offsetY: 0 }
    }
}

export function parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
        return value
    }
    if (typeof value === 'number') {
        return value === 1
    }
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase()
        return normalized === 'true' || normalized === '1' || normalized === 'yes'
    }
    return false
}

export function parseNumeric(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }
    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed.length === 0) {
            return undefined
        }
        const parsed = Number(trimmed)
        return Number.isFinite(parsed) ? parsed : undefined
    }
    return undefined
}

export function parseDashPattern(value: unknown): number[] | undefined {
    if (Array.isArray(value)) {
        const parsed = value
            .map((entry) => parseNumeric(entry))
            .filter((entry): entry is number => typeof entry === 'number')
        return parsed.length > 0 ? parsed : undefined
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed.length === 0) {
            return undefined
        }

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsedJson = JSON.parse(trimmed)
                return parseDashPattern(parsedJson)
            } catch {
                return undefined
            }
        }

        const parsed = trimmed
            .split(',')
            .map((entry) => parseNumeric(entry.trim()))
            .filter((entry): entry is number => typeof entry === 'number')
        return parsed.length > 0 ? parsed : undefined
    }

    return undefined
}

export function safeParseStyleObject(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object') {
        return value as Record<string, unknown>
    }

    if (typeof value === 'string' && value.trim().length > 0) {
        try {
            const parsed = JSON.parse(value)
            if (parsed && typeof parsed === 'object') {
                return parsed as Record<string, unknown>
            }
        } catch {
            return {}
        }
    }

    return {}
}

export function normalizeDrawingStyleProps(
    styleProps: Record<string, unknown>
): Record<string, unknown> {
    const normalized: Record<string, unknown> = { ...styleProps }

    const numericKeys: StylePropertyKey[] = [
        'iconSize',
        'textSize',
        'strokeWidth',
        'strokeOpacity',
        'fillOpacity',
        'intervalKilometers',
        'labelSize',
    ]

    for (const key of numericKeys) {
        const parsed = parseNumeric(normalized[key])
        if (typeof parsed === 'number') {
            normalized[key] = parsed
        }
    }

    const parsedDashPattern = parseDashPattern(normalized.dashPattern)
    if (parsedDashPattern) {
        normalized.dashPattern = parsedDashPattern
    }

    return normalized
}

export function resolveColoredSvgDataUrl(source: string, color?: string): string {
    if (!color || !source.startsWith('data:image/svg+xml;base64,')) {
        return source
    }

    if (typeof atob !== 'function' || typeof btoa !== 'function') {
        return source
    }

    try {
        const encodedSvg = source.replace('data:image/svg+xml;base64,', '')
        const decodedSvg = atob(encodedSvg)
        const recoloredSvg = decodedSvg
            .replace(/fill="#(?!fff\b|ffffff\b)[0-9a-fA-F]{3,6}"/gi, `fill="${color}"`)
            .replace(/stroke="#(?!fff\b|ffffff\b)[0-9a-fA-F]{3,6}"/gi, `stroke="${color}"`)
        return `data:image/svg+xml;base64,${btoa(recoloredSvg)}`
    } catch {
        return source
    }
}

export function isDrawingFeature(feature: FeatureLike): boolean {
    return Boolean(
        feature.get('kind') || feature.get('drawingStyle') || feature.get('isTextFeature')
    )
}

export function resolveStyleProps(feature: FeatureLike): Record<string, unknown> {
    const fromDrawingStyle = safeParseStyleObject(feature.get('drawingStyle'))
    const fromStyle = safeParseStyleObject(feature.get('style'))
    const merged: Record<string, unknown> = {
        ...fromDrawingStyle,
        ...fromStyle,
    }

    for (const key of STYLE_PROPERTY_KEYS) {
        const value = feature.get(key)
        if (value !== undefined && value !== null && value !== '') {
            merged[key] = value
        }
    }

    return normalizeDrawingStyleProps(merged)
}

export function resolveDrawingFeatureKind(
    feature: FeatureLike,
    styleProps?: Record<string, unknown>
): DrawingFeatureKindValue {
    const resolvedStyleProps = styleProps ?? resolveStyleProps(feature)
    const metadataKind = feature.get('kind')
    if (typeof metadataKind === 'string') {
        const normalizedKind = metadataKind.trim().toLowerCase()
        if (normalizedKind === 'measurementradius') {
            return 'MeasurementRadius'
        }
        if (normalizedKind === 'measurementpath') {
            return 'MeasurementPath'
        }
        if (normalizedKind === 'point') {
            return 'Point'
        }
        if (normalizedKind === 'text') {
            return 'Text'
        }
        if (normalizedKind === 'linestring') {
            return 'LineString'
        }
        if (normalizedKind === 'polygon') {
            return 'Polygon'
        }
    }

    const measurementSubtype = feature.get('measurementSubtype')
    if (typeof measurementSubtype === 'string') {
        const normalizedSubtype = measurementSubtype.trim().toLowerCase()
        if (normalizedSubtype === 'radius') {
            return 'MeasurementRadius'
        }
        if (normalizedSubtype === 'path') {
            return 'MeasurementPath'
        }
    }

    const geometryType = feature.getGeometry()?.getType()
    const measurementSubtypeFromStyle = resolvedStyleProps.measurementSubtype
    if (typeof measurementSubtypeFromStyle === 'string') {
        const normalizedSubtype = measurementSubtypeFromStyle.trim().toLowerCase()
        if (normalizedSubtype === 'radius') {
            return 'MeasurementRadius'
        }
        if (normalizedSubtype === 'path') {
            return 'MeasurementPath'
        }
    }

    if (geometryType === 'LineString') {
        const intervalFromStyle = parseNumeric(resolvedStyleProps.intervalKilometers)
        const intervalFromFeature = parseNumeric(feature.get('intervalKilometers'))
        const hasMeasurementInterval =
            typeof intervalFromStyle === 'number' || typeof intervalFromFeature === 'number'

        if (hasMeasurementInterval) {
            const coordinates = resolveLineStringCoordinates(feature)
            return coordinates.length >= 3 ? 'MeasurementPath' : 'MeasurementRadius'
        }
    }

    const explicitTextFeature = parseBoolean(feature.get('isTextFeature'))
    const hasIcon =
        (typeof resolvedStyleProps.iconId === 'string' && resolvedStyleProps.iconId.length > 0) ||
        (typeof feature.get('iconId') === 'string' && String(feature.get('iconId')).length > 0)

    if (explicitTextFeature) {
        return 'Text'
    }

    if (geometryType === 'Point' && hasIcon) {
        return 'Point'
    }

    if (geometryType === 'Point') {
        return 'Point'
    }
    if (geometryType === 'LineString') {
        return 'LineString'
    }
    if (geometryType === 'Polygon') {
        return 'Polygon'
    }

    return 'Unknown'
}

function resolveLineStringCoordinates(feature: FeatureLike): number[][] {
    const geometry = feature.getGeometry()
    if (!geometry || geometry.getType() !== 'LineString') {
        return []
    }

    if (geometry instanceof LineString) {
        return geometry.getCoordinates()
    }

    const maybeGeometry = geometry as unknown as {
        getCoordinates?: () => unknown
        getFlatCoordinates?: () => number[] | undefined
        getStride?: () => number | undefined
    }

    if (typeof maybeGeometry.getCoordinates === 'function') {
        const coordinates = maybeGeometry.getCoordinates()
        if (Array.isArray(coordinates)) {
            return coordinates as number[][]
        }
    }

    const flatCoordinates =
        typeof maybeGeometry.getFlatCoordinates === 'function'
            ? maybeGeometry.getFlatCoordinates()
            : undefined
    const stride =
        typeof maybeGeometry.getStride === 'function' ? (maybeGeometry.getStride() ?? 2) : 2

    if (!Array.isArray(flatCoordinates) || stride < 2 || flatCoordinates.length < stride) {
        return []
    }

    const coordinates: number[][] = []
    for (let index = 0; index + (stride - 1) < flatCoordinates.length; index += stride) {
        const x = flatCoordinates[index]
        const y = flatCoordinates[index + 1]
        if (typeof x === 'number' && typeof y === 'number') {
            coordinates.push([x, y])
        }
    }

    return coordinates
}

export function createDrawingFeatureStyleFunction(
    baseStyleLike: StyleLike | undefined
): StyleFunction {
    const resolveBaseStyles = (feature: FeatureLike, resolution = 0): StyleType[] => {
        if (!baseStyleLike) {
            return []
        }

        if (typeof baseStyleLike === 'function') {
            const styleResult = baseStyleLike(feature, resolution)
            if (!styleResult) {
                return []
            }

            return Array.isArray(styleResult) ? styleResult : [styleResult]
        }

        return Array.isArray(baseStyleLike) ? baseStyleLike : [baseStyleLike]
    }

    return (feature: FeatureLike, resolution: number): Style | Style[] | void => {
        const baseStyles = resolveBaseStyles(feature, resolution)
        const styleProps = resolveStyleProps(feature)
        const kind = resolveDrawingFeatureKind(feature, styleProps)
        const geometry = feature.getGeometry()
        const geometryType = geometry?.getType()
        const isSelected = parseBoolean(feature.get('__isSelected'))

        const textColor =
            typeof styleProps.textColor === 'string' && styleProps.textColor.length > 0
                ? styleProps.textColor
                : '#111827'
        const textSize =
            typeof styleProps.textSize === 'number' && Number.isFinite(styleProps.textSize)
                ? Math.max(10, styleProps.textSize)
                : 16
        const descriptionTextSize =
            textSize <= 12 ? Math.max(8, textSize - 2) : Math.max(10, textSize - 1)
        const description = String(feature.get('description') ?? '').trim()
        const isDescriptionVisible = parseBoolean(feature.get('isDescriptionVisible'))

        if (kind === 'Text' && geometryType === 'Point') {
            const textContent = String(feature.get('text') ?? feature.get('name') ?? '').trim()
            if (textContent.length === 0) {
                return createTextFeatureStyle('')
            }

            const styles: Style[] = [
                new Style({
                    text: new TextStyle({
                        text: textContent,
                        font: `${textSize}px sans-serif`,
                        fill: new Fill({ color: textColor }),
                        stroke: new Stroke({ color: '#ffffff', width: 3 }),
                        textAlign: 'center',
                        textBaseline: 'middle',
                        offsetX: 0,
                        offsetY:
                            isDescriptionVisible && description.length > 0
                                ? -descriptionTextSize * 0.65
                                : 0,
                    }),
                }),
            ]

            if (isDescriptionVisible && description.length > 0) {
                styles.push(
                    new Style({
                        text: new TextStyle({
                            text: description,
                            font: `${descriptionTextSize}px sans-serif`,
                            fill: new Fill({ color: textColor }),
                            stroke: new Stroke({ color: '#ffffff', width: 3 }),
                            textAlign: 'center',
                            textBaseline: 'middle',
                            offsetX: 0,
                            offsetY: textSize * 0.65,
                        }),
                    })
                )
            }

            return styles
        }

        if (kind === 'MeasurementRadius' && geometryType === 'LineString') {
            const coordinates = resolveLineStringCoordinates(feature)
            const centerCoordinate = coordinates[0]
            const edgeCoordinate = coordinates[1]

            if (!centerCoordinate || !edgeCoordinate) {
                return baseStyles
            }

            const centerX = centerCoordinate[0]
            const centerY = centerCoordinate[1]
            const edgeX = edgeCoordinate[0]
            const edgeY = edgeCoordinate[1]
            if (
                typeof centerX !== 'number' ||
                typeof centerY !== 'number' ||
                typeof edgeX !== 'number' ||
                typeof edgeY !== 'number'
            ) {
                return baseStyles
            }

            const radius = Math.hypot(edgeX - centerX, edgeY - centerY)
            if (radius <= 0) {
                return baseStyles
            }

            const strokeColor =
                typeof styleProps.strokeColor === 'string' && styleProps.strokeColor.length > 0
                    ? styleProps.strokeColor
                    : '#dc2626'
            const strokeWidth =
                typeof styleProps.strokeWidth === 'number' &&
                Number.isFinite(styleProps.strokeWidth)
                    ? Math.max(1, styleProps.strokeWidth)
                    : 2
            const strokeOpacity =
                typeof styleProps.strokeOpacity === 'number' &&
                Number.isFinite(styleProps.strokeOpacity)
                    ? Math.min(Math.max(styleProps.strokeOpacity, 0), 1)
                    : 1
            const dashPattern =
                Array.isArray(styleProps.dashPattern) &&
                styleProps.dashPattern.every(
                    (value) => typeof value === 'number' && Number.isFinite(value)
                )
                    ? styleProps.dashPattern
                    : [8, 4]
            const intervalKilometers =
                typeof styleProps.intervalKilometers === 'number' &&
                Number.isFinite(styleProps.intervalKilometers)
                    ? Math.max(1, styleProps.intervalKilometers)
                    : DEFAULT_MEASUREMENT_INTERVAL_KILOMETERS
            const intervalMeters = intervalKilometers * 1000
            const labelColor =
                typeof styleProps.labelColor === 'string' && styleProps.labelColor.length > 0
                    ? styleProps.labelColor
                    : '#111827'
            const labelSize =
                typeof styleProps.labelSize === 'number' && Number.isFinite(styleProps.labelSize)
                    ? Math.max(10, styleProps.labelSize)
                    : 12

            const createCircleRingCoordinates = (ringRadius: number, segments = 96): number[][] => {
                const circleCoordinates: number[][] = []
                for (let segmentIndex = 0; segmentIndex <= segments; segmentIndex += 1) {
                    const angle = (Math.PI * 2 * segmentIndex) / segments
                    circleCoordinates.push([
                        centerX + Math.cos(angle) * ringRadius,
                        centerY + Math.sin(angle) * ringRadius,
                    ])
                }
                return circleCoordinates
            }

            const measurementStyles: Style[] = [
                new Style({
                    geometry: new Polygon([createCircleRingCoordinates(radius)]),
                    stroke: new Stroke({
                        color: toRgbaColor(strokeColor, strokeOpacity),
                        width: strokeWidth,
                    }),
                    fill: new Fill({ color: 'rgba(0, 0, 0, 0)' }),
                }),
                new Style({
                    stroke: new Stroke({
                        color: toRgbaColor(strokeColor, strokeOpacity),
                        width: strokeWidth,
                        lineDash: dashPattern,
                    }),
                    image: new CircleStyle({
                        radius: 6,
                        fill: new Fill({ color: toRgbaColor(strokeColor, strokeOpacity) }),
                    }),
                }),
            ]

            const intervalCount = Math.min(
                Math.floor(radius / intervalMeters),
                MAX_MEASUREMENT_RADIUS_INTERVALS
            )
            for (let intervalIndex = 1; intervalIndex <= intervalCount; intervalIndex += 1) {
                const intervalRadius = intervalIndex * intervalMeters
                const markerCoordinate: [number, number] = [centerX + intervalRadius, centerY]
                measurementStyles.push(
                    new Style({
                        geometry: new Polygon([createCircleRingCoordinates(intervalRadius)]),
                        stroke: new Stroke({
                            color: toRgbaColor(strokeColor, Math.max(0.25, strokeOpacity * 0.55)),
                            width: 1,
                            lineDash: [4, 6],
                        }),
                        fill: new Fill({ color: 'rgba(0, 0, 0, 0)' }),
                    }),
                    new Style({
                        geometry: new Point(markerCoordinate),
                        image: new CircleStyle({
                            radius: 4,
                            fill: new Fill({ color: '#dc2626' }),
                        }),
                    }),
                    new Style({
                        geometry: new Point(markerCoordinate),
                        text: new TextStyle({
                            text: `${Math.round(intervalIndex * intervalKilometers)} km`,
                            font: `${labelSize}px sans-serif`,
                            fill: new Fill({ color: labelColor }),
                            stroke: new Stroke({ color: '#ffffff', width: 3 }),
                            textAlign: 'left',
                            textBaseline: 'middle',
                            offsetX: 8,
                            offsetY: 0,
                        }),
                    })
                )
            }

            const bearing = bearingBetweenCoordinates(centerCoordinate, edgeCoordinate)
            const radiusLabel =
                bearing === null
                    ? formatDistanceKilometers(radius)
                    : `${bearing.toFixed(2)}° / ${formatDistanceKilometers(radius)}`
            measurementStyles.push(
                new Style({
                    geometry: new Point(edgeCoordinate),
                    text: toMeasurementLabelStyle(radiusLabel),
                })
            )

            return measurementStyles
        }

        if (kind === 'MeasurementPath' && geometryType === 'LineString') {
            const coordinates = resolveLineStringCoordinates(feature)
            if (coordinates.length < 2) {
                return baseStyles
            }

            const strokeColor =
                typeof styleProps.strokeColor === 'string' && styleProps.strokeColor.length > 0
                    ? styleProps.strokeColor
                    : '#dc2626'
            const strokeWidth =
                typeof styleProps.strokeWidth === 'number' &&
                Number.isFinite(styleProps.strokeWidth)
                    ? Math.max(1, styleProps.strokeWidth)
                    : 3
            const strokeOpacity =
                typeof styleProps.strokeOpacity === 'number' &&
                Number.isFinite(styleProps.strokeOpacity)
                    ? Math.min(Math.max(styleProps.strokeOpacity, 0), 1)
                    : 1
            const dashPattern =
                Array.isArray(styleProps.dashPattern) &&
                styleProps.dashPattern.every(
                    (value) => typeof value === 'number' && Number.isFinite(value)
                )
                    ? styleProps.dashPattern
                    : [10, 7]
            const intervalKilometers =
                typeof styleProps.intervalKilometers === 'number' &&
                Number.isFinite(styleProps.intervalKilometers)
                    ? Math.max(1, styleProps.intervalKilometers)
                    : DEFAULT_MEASUREMENT_PATH_INTERVAL_KILOMETERS
            const intervalMeters = intervalKilometers * 1000

            let totalLength = 0
            const segmentLengths: number[] = []
            for (let index = 1; index < coordinates.length; index += 1) {
                const previousCoordinate = coordinates[index - 1]
                const currentCoordinate = coordinates[index]
                if (!previousCoordinate || !currentCoordinate) {
                    segmentLengths.push(0)
                    continue
                }

                const distance = Math.hypot(
                    currentCoordinate[0] - previousCoordinate[0],
                    currentCoordinate[1] - previousCoordinate[1]
                )
                segmentLengths.push(distance)
                totalLength += distance
            }

            const measurementStyles: Style[] = [
                new Style({
                    stroke: new Stroke({
                        color: toRgbaColor(strokeColor, strokeOpacity),
                        width: strokeWidth,
                        lineDash: dashPattern,
                    }),
                }),
            ]

            const endCoordinate = coordinates[coordinates.length - 1]
            if (endCoordinate) {
                measurementStyles.push(
                    new Style({
                        geometry: new Point(endCoordinate),
                        text: toMeasurementLabelStyle(formatDistanceKilometers(totalLength)),
                    })
                )
            }

            if (intervalMeters > 0 && totalLength >= intervalMeters) {
                let nextIntervalTarget = intervalMeters
                let traversed = 0

                for (let index = 1; index < coordinates.length; index += 1) {
                    const segmentLength = segmentLengths[index - 1] ?? 0
                    if (segmentLength <= 0) {
                        continue
                    }

                    const segmentStart = coordinates[index - 1]
                    const segmentEnd = coordinates[index]

                    while (nextIntervalTarget <= traversed + segmentLength) {
                        const distanceIntoSegment = nextIntervalTarget - traversed
                        const ratio = distanceIntoSegment / segmentLength
                        const markerCoordinate: [number, number] = [
                            segmentStart[0] + (segmentEnd[0] - segmentStart[0]) * ratio,
                            segmentStart[1] + (segmentEnd[1] - segmentStart[1]) * ratio,
                        ]

                        measurementStyles.push(
                            new Style({
                                geometry: new Point(markerCoordinate),
                                image: new CircleStyle({
                                    radius: 4,
                                    fill: new Fill({ color: '#dc2626' }),
                                }),
                            }),
                            new Style({
                                geometry: new Point(markerCoordinate),
                                text: new TextStyle({
                                    text: `${Math.round(nextIntervalTarget / 1000)} km`,
                                    font: '600 13px sans-serif',
                                    fill: new Fill({ color: '#111111' }),
                                    stroke: new Stroke({ color: '#ffffff', width: 3 }),
                                    textAlign: 'center',
                                    textBaseline: 'bottom',
                                    offsetY: -8,
                                }),
                            })
                        )

                        nextIntervalTarget += intervalMeters
                    }

                    traversed += segmentLength
                }
            }

            return measurementStyles
        }

        if (kind === 'Point' && geometryType === 'Point') {
            const pointTitle = String(feature.get('title') ?? feature.get('name') ?? '').trim()
            const iconSize =
                typeof styleProps.iconSize === 'number' && Number.isFinite(styleProps.iconSize)
                    ? Math.max(0.4, styleProps.iconSize)
                    : 1
            const iconColor =
                typeof styleProps.iconColor === 'string' && styleProps.iconColor.length > 0
                    ? styleProps.iconColor
                    : '#ef4444'

            const iconHref = String(feature.get('iconHref') ?? '').trim()
            const iconAnchorXRaw = parseNumeric(feature.get('iconAnchorX'))
            const iconAnchorYRaw = parseNumeric(feature.get('iconAnchorY'))
            const iconAnchorX =
                typeof iconAnchorXRaw === 'number' && Number.isFinite(iconAnchorXRaw)
                    ? iconAnchorXRaw
                    : 0.5
            const iconAnchorY =
                typeof iconAnchorYRaw === 'number' && Number.isFinite(iconAnchorYRaw)
                    ? iconAnchorYRaw
                    : 1

            const imageOnlyBaseStyles = baseStyles
                .map((baseStyle) => {
                    const image = baseStyle.getImage()
                    if (!image) {
                        return null
                    }

                    return new Style({
                        image,
                    })
                })
                .filter((style): style is Style => style instanceof Style)

            const pointStyles: Style[] =
                iconHref.length > 0
                    ? [
                          new Style({
                              image: new Icon({
                                  src: iconHref,
                                  scale: iconSize,
                                  anchor: [iconAnchorX, iconAnchorY],
                                  anchorXUnits: 'fraction',
                                  anchorYUnits: 'fraction',
                              }),
                          }),
                      ]
                    : imageOnlyBaseStyles.length > 0
                      ? imageOnlyBaseStyles
                      : [
                            new Style({
                                image: new CircleStyle({
                                    radius: Math.max(6, Math.round(7 * iconSize)),
                                    fill: new Fill({ color: iconColor }),
                                    stroke: new Stroke({ color: '#ffffff', width: 2 }),
                                }),
                            }),
                        ]

            if (isSelected) {
                pointStyles.unshift(
                    new Style({
                        image: new CircleStyle({
                            radius: 14,
                            fill: new Fill({ color: 'rgba(37, 99, 235, 0.12)' }),
                            stroke: new Stroke({
                                color: '#2563eb',
                                width: 2,
                            }),
                        }),
                    })
                )
            }

            if (pointTitle.length === 0 && !(isDescriptionVisible && description.length > 0)) {
                return pointStyles
            }

            const textAnchor =
                typeof styleProps.textAnchor === 'string'
                    ? (styleProps.textAnchor as TextAnchor)
                    : 'center'
            const pointLabelAnchor = resolvePointLabelAnchor(textAnchor)
            const lineGap = Math.max(12, descriptionTextSize + 2)
            const titleOffsetY =
                pointLabelAnchor.offsetY -
                (isDescriptionVisible && description.length > 0 ? lineGap / 2 : 0)

            if (pointTitle.length > 0) {
                pointStyles.push(
                    new Style({
                        text: new TextStyle({
                            text: pointTitle,
                            font: `${textSize}px sans-serif`,
                            fill: new Fill({ color: textColor }),
                            stroke: new Stroke({ color: '#ffffff', width: 3 }),
                            textAlign: pointLabelAnchor.textAlign,
                            textBaseline: 'middle',
                            offsetX: pointLabelAnchor.offsetX,
                            offsetY: titleOffsetY,
                        }),
                    })
                )
            }

            if (isDescriptionVisible && description.length > 0) {
                pointStyles.push(
                    new Style({
                        text: new TextStyle({
                            text: description,
                            font: `${descriptionTextSize}px sans-serif`,
                            fill: new Fill({ color: textColor }),
                            stroke: new Stroke({ color: '#ffffff', width: 3 }),
                            textAlign: pointLabelAnchor.textAlign,
                            textBaseline: 'middle',
                            offsetX: pointLabelAnchor.offsetX,
                            offsetY: titleOffsetY + lineGap,
                        }),
                    })
                )
            }

            return pointStyles
        }

        const strokeColor =
            typeof styleProps.strokeColor === 'string' && styleProps.strokeColor.length > 0
                ? styleProps.strokeColor
                : '#ff0000'
        const strokeWidth =
            typeof styleProps.strokeWidth === 'number' && Number.isFinite(styleProps.strokeWidth)
                ? Math.max(1, styleProps.strokeWidth)
                : 2
        const strokeOpacity =
            typeof styleProps.strokeOpacity === 'number' &&
            Number.isFinite(styleProps.strokeOpacity)
                ? Math.min(Math.max(styleProps.strokeOpacity, 0), 1)
                : 1
        const fillColor =
            typeof styleProps.fillColor === 'string' && styleProps.fillColor.length > 0
                ? styleProps.fillColor
                : '#ff0000'
        const fillOpacity =
            typeof styleProps.fillOpacity === 'number' && Number.isFinite(styleProps.fillOpacity)
                ? Math.min(Math.max(styleProps.fillOpacity, 0), 1)
                : 0.2
        const dashPattern =
            Array.isArray(styleProps.dashPattern) &&
            styleProps.dashPattern.every(
                (value) => typeof value === 'number' && Number.isFinite(value)
            )
                ? styleProps.dashPattern
                : undefined

        const regularStyle = new Style({
            fill:
                geometryType === 'Polygon'
                    ? new Fill({ color: toRgbaColor(fillColor, fillOpacity) })
                    : undefined,
            stroke: new Stroke({
                color: toRgbaColor(strokeColor, strokeOpacity),
                width: strokeWidth,
                lineDash: dashPattern,
            }),
            image: new CircleStyle({
                radius: 7,
                fill: new Fill({ color: strokeColor }),
            }),
        })

        if (!isSelected) {
            return regularStyle
        }

        const selectedStyles: Style[] = [regularStyle]

        if (kind !== 'LineString') {
            selectedStyles.push(
                new Style({
                    fill: new Fill({
                        color: 'rgba(37, 99, 235, 0.12)',
                    }),
                    stroke: new Stroke({
                        color: '#2563eb',
                        width: 4,
                    }),
                    image: new CircleStyle({
                        radius: 9,
                        fill: new Fill({
                            color: '#2563eb',
                        }),
                    }),
                })
            )
        }

        if (kind === 'LineString') {
            selectedStyles.push(
                new Style({
                    stroke: new Stroke({
                        color: toRgbaColor(strokeColor, strokeOpacity),
                        width: strokeWidth,
                        lineDash: dashPattern,
                    }),
                })
            )
        }

        if (geometryType === 'LineString' || geometryType === 'Polygon') {
            selectedStyles.push(
                new Style({
                    geometry: (styledFeature) => {
                        const styledGeometry = styledFeature.getGeometry()
                        if (!styledGeometry) {
                            return undefined
                        }

                        if (styledGeometry.getType() === 'LineString') {
                            const coordinates = (styledGeometry as LineString).getCoordinates()
                            return coordinates.length > 0
                                ? new MultiPoint(coordinates.map((coordinate) => [...coordinate]))
                                : undefined
                        }

                        if (styledGeometry.getType() === 'Polygon') {
                            const ringVertices = (styledGeometry as Polygon)
                                .getCoordinates()
                                .flatMap((ring) => ring.slice(0, -1))
                            return ringVertices.length > 0
                                ? new MultiPoint(ringVertices.map((coordinate) => [...coordinate]))
                                : undefined
                        }

                        return undefined
                    },
                    image: new CircleStyle({
                        radius: 6,
                        fill: new Fill({
                            color: '#ffffff',
                        }),
                        stroke: new Stroke({
                            color: '#111111',
                            width: 1.5,
                        }),
                    }),
                })
            )
        }

        return selectedStyles
    }
}
