import type { Feature, Map as OlMap } from 'ol'
import type { EventsKey } from 'ol/events'
import type { Geometry } from 'ol/geom'
import type { Type } from 'ol/geom/Geometry'
import type { StyleFunction, StyleLike } from 'ol/style/Style'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import {
    bearingBetweenCoordinates,
    DEFAULT_MEASUREMENT_INTERVAL_KILOMETERS,
    DEFAULT_MEASUREMENT_PATH_INTERVAL_KILOMETERS,
    formatDistanceKilometers,
    resolveDrawingFeatureKind,
    resolvePointLabelAnchor,
    toMeasurementLabelStyle,
    toRgbaColor,
} from '@swissgeo/shared'
import { primaryAction } from 'ol/events/condition'
import OlFeature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import MultiPoint from 'ol/geom/MultiPoint'
import Point from 'ol/geom/Point'
import Polygon from 'ol/geom/Polygon'
import DoubleClickZoom from 'ol/interaction/DoubleClickZoom'
import Draw from 'ol/interaction/Draw'
import Modify from 'ol/interaction/Modify'
import Snap from 'ol/interaction/Snap'
import VectorLayer from 'ol/layer/Vector'
import { unByKey } from 'ol/Observable'
import { register } from 'ol/proj/proj4'
import VectorSource from 'ol/source/Vector'
import { Circle as CircleStyle, Fill, Icon, Stroke, Style, Text as TextStyle } from 'ol/style'
import { getUid } from 'ol/util'
import proj4 from 'proj4'
import { inject, markRaw, onBeforeUnmount, readonly, ref, toValue } from 'vue'

import type {
    DrawingFeatureInfoPayload,
    DrawingFeatureKind,
    DrawingHoverHintPayload,
    DrawingMode,
    TextAnchor,
} from '@/types'
import type { MarkerIcon } from '@/utils/markerIcons'

import { useDrawingStore } from '@/stores/drawing'
import { DEFAULT_MARKER_ICON, getMarkerIconById } from '@/utils/markerIcons'

interface UseOlDrawingOptions {
    translate?: (key: string, params?: Record<string, string | number>) => string
}
/**
 * Composable for handling OpenLayers drawing interactions
 */
export function useOlDrawing(
    layerId: string,
    uuid: string,
    opacity: number,
    options?: UseOlDrawingOptions
) {
    // TODO: Consider passing the map as a parameter instead of using inject
    const olMap = toValue(inject<OlMap>('olMap'))
    const drawingStore = useDrawingStore()
    register(proj4)
    // Track the currently selected icon for new point features
    const selectedIcon = ref<MarkerIcon>(DEFAULT_MARKER_ICON!)

    if (!olMap) {
        log.error('OpenLayersMap is not available')
        throw new Error('OpenLayersMap is not available')
    }

    const source = new VectorSource({
        wrapX: false,
    })

    const endpointHandleSource = new VectorSource({
        wrapX: false,
    })

    const endpointHandleLayer = new VectorLayer({
        source: endpointHandleSource,
        visible: false,
        zIndex: 100_000,
        style: () =>
            new Style({
                image: new CircleStyle({
                    radius: 14,
                    fill: new Fill({ color: 'rgba(17, 24, 39, 0.85)' }),
                    stroke: new Stroke({ color: '#ffffff', width: 2 }),
                }),
                text: new TextStyle({
                    text: '+',
                    font: 'bold 18px sans-serif',
                    fill: new Fill({ color: '#ffffff' }),
                    textAlign: 'center',
                    textBaseline: 'middle',
                }),
            }),
    })

    const markerIconColorCache = new Map<string, string>()
    const ENDPOINT_HANDLE_OFFSET_PIXELS = 34

    const translateUi = (key: string, params?: Record<string, string | number>) => {
        const translated = options?.translate?.(key, params)
        if (translated && translated !== key) {
            return translated
        }

        if (key === 'debug.drawingHoverHint.selectFeature') {
            return `Click to select the ${String(params?.target ?? 'feature')}`
        }
        if (key === 'debug.drawingHoverHint.nothingToSelect') {
            return 'Nothing to select'
        }
        if (key === 'debug.drawingHoverHint.targetMarker') {
            return 'marker'
        }
        if (key === 'debug.drawingHoverHint.targetText') {
            return 'text'
        }
        if (key === 'debug.drawingHoverHint.targetLine') {
            return 'line'
        }
        if (key === 'debug.drawingHoverHint.targetPolygon') {
            return 'polygon'
        }
        if (key === 'debug.drawingHoverHint.targetMeasurement') {
            return 'measurement'
        }
        if (key === 'debug.drawingHoverHint.targetFeature') {
            return 'feature'
        }

        return key
    }

    const resolveColoredMarkerSource = (icon: MarkerIcon, color?: string) => {
        if (!color || !icon.dataUrl.startsWith('data:image/svg+xml;base64,')) {
            return icon.dataUrl
        }

        const cacheKey = `${icon.id}:${color}`
        const cachedSource = markerIconColorCache.get(cacheKey)
        if (cachedSource) {
            return cachedSource
        }

        if (typeof atob !== 'function' || typeof btoa !== 'function') {
            return icon.dataUrl
        }

        try {
            const encodedSvg = icon.dataUrl.replace('data:image/svg+xml;base64,', '')
            const decodedSvg = atob(encodedSvg)
            const recoloredSvg = decodedSvg
                .replace(/fill="#(?!fff\b|ffffff\b)[0-9a-fA-F]{3,6}"/g, `fill="${color}"`)
                .replace(/stroke="#(?!fff\b|ffffff\b)[0-9a-fA-F]{3,6}"/g, `stroke="${color}"`)
            const recoloredSource = `data:image/svg+xml;base64,${btoa(recoloredSvg)}`

            markerIconColorCache.set(cacheKey, recoloredSource)
            return recoloredSource
        } catch {
            return icon.dataUrl
        }
    }

    // Style function that handles both regular features and text features
    const styleFunction = (feature: Feature<Geometry>): StyleLike => {
        const isSelected = Boolean(feature.get('__isSelected'))
        const textContent = feature.get('text')

        const rawStyle = feature.get('style')
        const styleProps =
            rawStyle && typeof rawStyle === 'object'
                ? (rawStyle as Record<string, unknown>)
                : ({} as Record<string, unknown>)

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
        const isDescriptionVisible = Boolean(feature.get('isDescriptionVisible'))

        if (textContent) {
            const styles: Style[] = []
            const textStyle = new Style({
                text: new TextStyle({
                    text: String(textContent),
                    font: `${textSize}px sans-serif`,
                    fill: new Fill({ color: textColor }),
                    stroke: new Stroke({
                        color: '#ffffff',
                        width: 3,
                    }),
                    textAlign: 'center',
                    textBaseline: 'middle',
                    offsetX: 0,
                    offsetY:
                        isDescriptionVisible && description.length > 0
                            ? -descriptionTextSize * 0.65
                            : 0,
                }),
            })
            styles.push(textStyle)

            if (isDescriptionVisible && description.length > 0) {
                styles.push(
                    new Style({
                        text: new TextStyle({
                            text: description,
                            font: `${descriptionTextSize}px sans-serif`,
                            fill: new Fill({ color: textColor }),
                            stroke: new Stroke({
                                color: '#ffffff',
                                width: 3,
                            }),
                            textAlign: 'center',
                            textBaseline: 'middle',
                            offsetX: 0,
                            offsetY: textSize * 0.65,
                        }),
                    })
                )
            }

            if (isSelected && feature.getGeometry()?.getType() === 'Point') {
                styles.push(
                    new Style({
                        image: new CircleStyle({
                            radius: 13,
                            fill: new Fill({ color: 'rgba(37, 99, 235, 0.12)' }),
                            stroke: new Stroke({
                                color: '#2563eb',
                                width: 2,
                            }),
                        }),
                    })
                )
            }

            if (styles.length === 1) {
                return styles[0]!
            }

            return styles
        }

        // Check if this is a Point geometry with an icon
        const geomType = feature.getGeometry()?.getType()
        if (geomType === 'Point') {
            const iconId =
                (styleProps.iconId as string | undefined) ||
                (feature.get('iconId') as string | undefined)
            const iconColor =
                typeof styleProps.iconColor === 'string' && styleProps.iconColor.length > 0
                    ? styleProps.iconColor
                    : undefined
            const pointTitle = String(feature.get('title') ?? '').trim()
            const iconSize =
                typeof styleProps.iconSize === 'number' && Number.isFinite(styleProps.iconSize)
                    ? Math.max(0.4, styleProps.iconSize)
                    : 1
            const textAnchor =
                typeof styleProps.textAnchor === 'string'
                    ? (styleProps.textAnchor as TextAnchor)
                    : 'center'
            const pointLabelAnchor = resolvePointLabelAnchor(textAnchor)
            const icon = iconId ? getMarkerIconById(iconId) : selectedIcon.value

            if (icon) {
                const baseStyle = new Style({
                    image: new Icon({
                        src: resolveColoredMarkerSource(icon, iconColor),
                        scale: iconSize,
                        anchor: icon.anchor, // Use icon-specific anchor point
                        anchorXUnits: 'fraction',
                        anchorYUnits: 'fraction',
                    }),
                })

                const styles: Style[] = []

                if (isSelected) {
                    styles.push(
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

                styles.push(baseStyle)

                const lineGap = Math.max(12, descriptionTextSize + 2)
                const titleOffsetY =
                    pointLabelAnchor.offsetY -
                    (isDescriptionVisible && description.length > 0 ? lineGap / 2 : 0)

                if (pointTitle.length > 0) {
                    styles.push(
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
                    styles.push(
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

                if (styles.length === 1) {
                    return styles[0]!
                }

                return styles
            }
        }

        const featureKind = resolveFeatureKind(feature)

        // Measurement radius styling: render circle + interval rings/labels from center-to-edge line
        if (featureKind === 'MeasurementRadius' && geomType === 'LineString') {
            const geometry = feature.getGeometry() as LineString
            const coordinates = geometry.getCoordinates()
            const centerCoordinate = coordinates[0]
            const edgeCoordinate = coordinates[1]

            if (centerCoordinate && edgeCoordinate) {
                const centerX = centerCoordinate[0]
                const centerY = centerCoordinate[1]
                const edgeX = edgeCoordinate[0]
                const edgeY = edgeCoordinate[1]

                if (
                    typeof centerX === 'number' &&
                    typeof centerY === 'number' &&
                    typeof edgeX === 'number' &&
                    typeof edgeY === 'number'
                ) {
                    const radius = Math.hypot(edgeX - centerX, edgeY - centerY)

                    if (radius > 0) {
                        const strokeColor =
                            typeof styleProps.strokeColor === 'string' &&
                            styleProps.strokeColor.length > 0
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
                            typeof styleProps.labelColor === 'string' &&
                            styleProps.labelColor.length > 0
                                ? styleProps.labelColor
                                : '#111827'
                        const labelSize =
                            typeof styleProps.labelSize === 'number' &&
                            Number.isFinite(styleProps.labelSize)
                                ? Math.max(10, styleProps.labelSize)
                                : 12

                        const createCircleRingCoordinates = (
                            ringRadius: number,
                            segments = 96
                        ): number[][] => {
                            const circleCoordinates: number[][] = []
                            for (
                                let segmentIndex = 0;
                                segmentIndex <= segments;
                                segmentIndex += 1
                            ) {
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
                                geometry,
                                stroke: new Stroke({
                                    color: toRgbaColor(strokeColor, strokeOpacity),
                                    width: strokeWidth,
                                    lineDash: dashPattern,
                                }),
                                image: new CircleStyle({
                                    radius: 6,
                                    fill: new Fill({
                                        color: toRgbaColor(strokeColor, strokeOpacity),
                                    }),
                                }),
                            }),
                        ]

                        const intervalCount = Math.floor(radius / intervalMeters)
                        for (
                            let intervalIndex = 1;
                            intervalIndex <= intervalCount;
                            intervalIndex += 1
                        ) {
                            const intervalRadius = intervalIndex * intervalMeters
                            measurementStyles.push(
                                new Style({
                                    geometry: new Polygon([
                                        createCircleRingCoordinates(intervalRadius),
                                    ]),
                                    stroke: new Stroke({
                                        color: toRgbaColor(
                                            strokeColor,
                                            Math.max(0.25, strokeOpacity * 0.55)
                                        ),
                                        width: 1,
                                        lineDash: [4, 6],
                                    }),
                                    fill: new Fill({ color: 'rgba(0, 0, 0, 0)' }),
                                })
                            )
                            measurementStyles.push(
                                new Style({
                                    geometry: new Point([centerX + intervalRadius, centerY]),
                                    image: new CircleStyle({
                                        radius: 4,
                                        fill: new Fill({ color: '#dc2626' }),
                                    }),
                                })
                            )
                            measurementStyles.push(
                                new Style({
                                    geometry: new Point([centerX + intervalRadius, centerY]),
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

                        if (isSelected) {
                            measurementStyles.push(
                                new Style({
                                    stroke: new Stroke({
                                        color: '#2563eb',
                                        width: 4,
                                    }),
                                }),
                                new Style({
                                    geometry: new MultiPoint(
                                        coordinates.map((coordinate) => [...coordinate])
                                    ),
                                    image: new CircleStyle({
                                        radius: 6,
                                        fill: new Fill({ color: '#ffffff' }),
                                        stroke: new Stroke({
                                            color: '#2563eb',
                                            width: 2,
                                        }),
                                    }),
                                })
                            )
                        }

                        return measurementStyles
                    }
                }
            }
        }

        if (featureKind === 'MeasurementPath' && geomType === 'LineString') {
            const geometry = feature.getGeometry() as LineString
            const coordinates = geometry.getCoordinates()
            if (coordinates.length >= 2) {
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
                        currentCoordinate[0]! - previousCoordinate[0]!,
                        currentCoordinate[1]! - previousCoordinate[1]!
                    )
                    segmentLengths.push(distance)
                    totalLength += distance
                }

                const measurementStyles: Style[] = [
                    new Style({
                        geometry,
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

                        const segmentStart = coordinates[index - 1]!
                        const segmentEnd = coordinates[index]!

                        while (nextIntervalTarget <= traversed + segmentLength) {
                            const distanceIntoSegment = nextIntervalTarget - traversed
                            const ratio = distanceIntoSegment / segmentLength
                            const markerCoordinate: number[] = [
                                segmentStart[0]! + (segmentEnd[0]! - segmentStart[0]!) * ratio,
                                segmentStart[1]! + (segmentEnd[1]! - segmentStart[1]!) * ratio,
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

                if (isSelected) {
                    measurementStyles.push(
                        new Style({
                            geometry: new MultiPoint(
                                coordinates.map((coordinate) => [...coordinate])
                            ),
                            image: new CircleStyle({
                                radius: 6,
                                fill: new Fill({ color: '#ffffff' }),
                                stroke: new Stroke({
                                    color: '#111111',
                                    width: 1.5,
                                }),
                            }),
                        })
                    )
                }

                return measurementStyles
            }
        }

        // Regular feature styling (lines, polygons)
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
            fill: new Fill({
                color: toRgbaColor(fillColor, fillOpacity),
            }),
            stroke: new Stroke({
                color: toRgbaColor(strokeColor, strokeOpacity),
                width: strokeWidth,
                lineDash: dashPattern,
            }),
            image: new CircleStyle({
                radius: 7,
                fill: new Fill({
                    color: strokeColor,
                }),
            }),
        })

        if (!isSelected) {
            return regularStyle
        }

        const selectedStyles: Style[] = [regularStyle]

        if (featureKind !== 'LineString' && featureKind !== 'Polygon') {
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

        if (featureKind === 'LineString') {
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

        if (geomType === 'LineString' || geomType === 'Polygon') {
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

    function createOlLayer(layerId: string, uuid: string): VectorLayer {
        const olLayer = new VectorLayer({
            properties: {
                id: layerId,
                uuid,
            },
            opacity,
            source,
            style: styleFunction as StyleFunction,
        })
        // Use markRaw to prevent Vue from making this reactive (huge performance improvement)
        drawingStore.setOlLayer(markRaw(olLayer))
        return olLayer
    }

    let currentDraw: Draw | null = null
    let currentModify: Modify | null = null
    let currentSnap: Snap | null = null
    let endpointExtensionSnap: Snap | null = null
    let passiveClickListener: EventsKey | null = null
    let passiveMoveListener: EventsKey | null = null
    let activeClickListener: EventsKey | null = null
    let activeMoveListener: EventsKey | null = null
    let activeDblClickListener: EventsKey | null = null
    let activeModifyEndListener: EventsKey | null = null
    let activeFeatureAddListener: EventsKey | null = null
    let activeFeatureRemoveListener: EventsKey | null = null
    let activeContextMenuListener: ((event: MouseEvent) => void) | null = null
    let activeViewportDblClickListener: ((event: MouseEvent) => void) | null = null
    let passiveOutListener: ((event: PointerEvent) => void) | null = null
    let endpointExtensionInProgress = false
    let reverseExtendedFeatureOnFinish = false
    let suppressNextActiveSingleClick = false
    let suppressDoubleClickZoomUntil = 0
    let temporarilyDisabledDoubleClickZoomInteractions: DoubleClickZoom[] = []
    const layer = createOlLayer(layerId, uuid)
    // Add layer to map immediately
    olMap.addLayer(layer)
    olMap.addLayer(endpointHandleLayer)
    log.debug(`Added drawing layer ${layerId} to map`)

    onBeforeUnmount(() => {
        stopDrawing()
        disableActiveEditing()
        disablePassiveInspection()
        olMap.removeLayer(endpointHandleLayer)
        olMap.removeLayer(layer)
    })

    /**
     * Start drawing with the specified geometry type
     */
    function startDrawing(
        type: DrawingMode,
        onFeatureAdded?: (feature: Feature<Geometry>) => void
    ) {
        // Stop any existing draw interaction first
        stopDrawing()

        addDrawingInteraction(type, onFeatureAdded)

        log.debug(`Started drawing ${type}, interaction added to map`)
    }

    function addDrawingInteraction(
        type: DrawingMode,
        onFeatureAdded?: (feature: Feature<Geometry>) => void
    ) {
        const isLineFirstDrawMode = type === 'LineString' || type === 'Polygon'
        // For text, we use Point geometry
        const geometryType =
            type === 'Text'
                ? 'Point'
                : type === 'Measurement'
                  ? 'LineString'
                  : isLineFirstDrawMode
                    ? 'Polygon'
                    : type
        let measurementGeometryListener: EventsKey | null = null
        let lineSketchAddFeatureListener: EventsKey | null = null
        let lineSketchPointCount = 0
        let lineIsSnappingOnFirstPoint = false
        const clearMeasurementGeometryListener = () => {
            if (measurementGeometryListener) {
                unByKey(measurementGeometryListener)
                measurementGeometryListener = null
            }
        }
        const clearLineSketchListener = () => {
            if (lineSketchAddFeatureListener) {
                unByKey(lineSketchAddFeatureListener)
                lineSketchAddFeatureListener = null
            }
        }

        const getFeatureCoordinatesWithoutExtraPoint = (feature: Feature<Geometry>): number[][] => {
            const geometry = feature.getGeometry()
            if (geometry instanceof Polygon) {
                const ring = geometry.getCoordinates()[0]
                return ring ? ring.slice(0, -1) : []
            }
            if (geometry instanceof LineString) {
                return geometry.getCoordinates()
            }
            return []
        }

        const checkIfSnappingOnFirstPoint = (feature: Feature<Geometry>) => {
            const geometry = feature.getGeometry()
            if (!(geometry instanceof Polygon)) {
                return
            }

            const lineCoordinates = getFeatureCoordinatesWithoutExtraPoint(feature)
            if (lineSketchPointCount !== lineCoordinates.length) {
                lineSketchPointCount = lineCoordinates.length
                return
            }

            if (lineCoordinates.length <= 1) {
                return
            }

            const firstPoint = lineCoordinates[0]
            const lastPoint = lineCoordinates[lineCoordinates.length - 1]
            const sketchPoint = lineCoordinates[lineCoordinates.length - 2]
            if (!firstPoint || !lastPoint || !sketchPoint) {
                return
            }

            const isSnapOnFirstPoint =
                lastPoint[0] === firstPoint[0] && lastPoint[1] === firstPoint[1]
            const isSnapOnLastPoint =
                lastPoint[0] === sketchPoint[0] && lastPoint[1] === sketchPoint[1]

            lineIsSnappingOnFirstPoint = !isSnapOnLastPoint && isSnapOnFirstPoint
        }

        const measurementSketchStyle: StyleFunction = (feature) => {
            const geometry = feature.getGeometry()
            if (geometry instanceof Point) {
                return new Style({
                    image: new CircleStyle({
                        radius: 6,
                        fill: new Fill({ color: '#ffffff' }),
                        stroke: new Stroke({ color: '#111111', width: 1.5 }),
                    }),
                })
            }

            if (!(geometry instanceof LineString)) {
                return undefined
            }

            const coordinates = geometry.getCoordinates()
            if (coordinates.length < 2) {
                const firstCoordinate = coordinates[0]
                return new Style({
                    geometry: firstCoordinate ? new Point(firstCoordinate) : undefined,
                    image: new CircleStyle({
                        radius: 6,
                        fill: new Fill({ color: '#ffffff' }),
                        stroke: new Stroke({ color: '#111111', width: 1.5 }),
                    }),
                })
            }

            const centerCoordinate = coordinates[0]!
            const edgeCoordinate = coordinates[coordinates.length - 1]!
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
                return new Style({
                    stroke: new Stroke({
                        color: '#dc2626',
                        width: 3,
                        lineDash: [10, 7],
                    }),
                })
            }

            const radius = Math.hypot(edgeX - centerX, edgeY - centerY)
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

            const drawSubtype = coordinates.length >= 3 ? 'Path' : 'Radius'

            if (drawSubtype === 'Path') {
                return [
                    new Style({
                        geometry,
                        stroke: new Stroke({
                            color: '#dc2626',
                            width: 3,
                            lineDash: [10, 7],
                        }),
                    }),
                    new Style({
                        geometry: new MultiPoint(coordinates.map((coordinate) => [...coordinate])),
                        image: new CircleStyle({
                            radius: 5,
                            fill: new Fill({ color: '#ffffff' }),
                            stroke: new Stroke({ color: '#111111', width: 1.5 }),
                        }),
                    }),
                    new Style({
                        geometry: new Point(edgeCoordinate),
                        text: toMeasurementLabelStyle(
                            formatDistanceKilometers(
                                coordinates.reduce((totalLength, coordinate, index) => {
                                    if (index === 0) {
                                        return totalLength
                                    }
                                    const previousCoordinate = coordinates[index - 1]
                                    if (!previousCoordinate) {
                                        return totalLength
                                    }
                                    return (
                                        totalLength +
                                        Math.hypot(
                                            coordinate[0]! - previousCoordinate[0]!,
                                            coordinate[1]! - previousCoordinate[1]!
                                        )
                                    )
                                }, 0)
                            )
                        ),
                    }),
                ]
            }

            const bearing = bearingBetweenCoordinates(centerCoordinate, edgeCoordinate)
            const radiusLabel =
                bearing === null
                    ? formatDistanceKilometers(radius)
                    : `${bearing.toFixed(2)}° / ${formatDistanceKilometers(radius)}`

            return [
                new Style({
                    geometry: new Polygon([createCircleRingCoordinates(radius)]),
                    stroke: new Stroke({ color: '#dc2626', width: 2 }),
                    fill: new Fill({ color: 'rgba(0, 0, 0, 0)' }),
                }),
                new Style({
                    geometry,
                    stroke: new Stroke({ color: '#dc2626', width: 2, lineDash: [8, 4] }),
                    image: new CircleStyle({
                        radius: 6,
                        fill: new Fill({ color: '#dc2626' }),
                    }),
                }),
                new Style({
                    geometry: new Point(edgeCoordinate),
                    text: toMeasurementLabelStyle(radiusLabel),
                }),
            ]
        }

        const lineSketchStyle: StyleFunction = (feature) => {
            const geometry = feature.getGeometry()
            if (!geometry) {
                return undefined
            }

            if (geometry instanceof Point) {
                return new Style({
                    image: new CircleStyle({
                        radius: 6,
                        fill: new Fill({ color: '#ffffff' }),
                        stroke: new Stroke({ color: '#111111', width: 1.5 }),
                    }),
                })
            }

            let coordinates: number[][] = []

            if (geometry instanceof LineString) {
                coordinates = geometry.getCoordinates()
            } else if (geometry instanceof Polygon) {
                const ring = geometry.getCoordinates()[0]
                coordinates = ring ? ring.slice(0, -1) : []
            }

            if (coordinates.length === 0) {
                return undefined
            }

            return [
                new Style({
                    geometry: new LineString(coordinates),
                    stroke: new Stroke({
                        color: '#ff0000',
                        width: 2,
                    }),
                }),
                new Style({
                    geometry: new MultiPoint(coordinates.map((coordinate) => [...coordinate])),
                    image: new CircleStyle({
                        radius: 6,
                        fill: new Fill({ color: '#ffffff' }),
                        stroke: new Stroke({ color: '#111111', width: 1.5 }),
                    }),
                }),
            ]
        }

        currentDraw = new Draw({
            source,
            type: geometryType as Type,
            minPoints: isLineFirstDrawMode ? 2 : undefined,
            stopClick: true,
            condition: (event) => primaryAction(event),
            style:
                type === 'Measurement'
                    ? measurementSketchStyle
                    : isLineFirstDrawMode
                      ? lineSketchStyle
                      : undefined,
        })

        if (type === 'Measurement') {
            currentDraw.on('drawstart', (event) => {
                drawingStore.setMeasurementSubtype('Radius')

                const geometry = event.feature.getGeometry()
                if (!(geometry instanceof LineString)) {
                    return
                }

                clearMeasurementGeometryListener()
                measurementGeometryListener = geometry.on('change', () => {
                    const coordinates = geometry.getCoordinates()
                    drawingStore.setMeasurementSubtype(coordinates.length >= 3 ? 'Path' : 'Radius')
                })
            })
        }

        if (isLineFirstDrawMode) {
            currentDraw.on('drawstart', (_event) => {
                lineSketchPointCount = 0
                lineIsSnappingOnFirstPoint = false
                clearLineSketchListener()

                const sketchSource = currentDraw?.getOverlay().getSource()
                if (!sketchSource) {
                    return
                }

                lineSketchAddFeatureListener = sketchSource.on('addfeature', (addFeatureEvent) => {
                    checkIfSnappingOnFirstPoint(addFeatureEvent.feature as Feature<Geometry>)
                })
            })
        }

        currentDraw.on('drawend', (event) => {
            clearMeasurementGeometryListener()
            clearLineSketchListener()
            log.debug(`Feature drawn: ${type}`, event.feature)

            // If this is a text feature, set default text
            if (type === 'Text') {
                event.feature.set('text', 'New Text')
                drawingStore.updateFeatureAttributes(event.feature, {
                    kind: 'Text',
                    style: {
                        textColor: '#111827',
                        textSize: 16,
                        textAnchor: 'center',
                    },
                })
                // Force style update
                event.feature.changed()
            }

            // If this is a point feature, store the icon ID
            if (type === 'Point') {
                drawingStore.updateFeatureAttributes(event.feature, {
                    kind: 'Point',
                    style: {
                        iconId: selectedIcon.value.id,
                        iconSize: 1,
                    },
                })
                event.feature.changed()
            }

            if (type === 'Measurement') {
                const geometry = event.feature.getGeometry()
                const coordinates = geometry instanceof LineString ? geometry.getCoordinates() : []
                const measurementSubtype = coordinates.length >= 3 ? 'Path' : 'Radius'

                drawingStore.setMeasurementSubtype(measurementSubtype)
                drawingStore.updateFeatureAttributes(event.feature, {
                    kind: measurementSubtype === 'Path' ? 'MeasurementPath' : 'MeasurementRadius',
                    measurementSubtype,
                    style: {
                        intervalKilometers:
                            measurementSubtype === 'Path'
                                ? DEFAULT_MEASUREMENT_PATH_INTERVAL_KILOMETERS
                                : DEFAULT_MEASUREMENT_INTERVAL_KILOMETERS,
                        labelColor: '#111827',
                        labelSize: 12,
                        strokeColor: '#dc2626',
                        strokeWidth: measurementSubtype === 'Path' ? 3 : 2,
                        strokeOpacity: 1,
                        dashPattern: measurementSubtype === 'Path' ? [10, 7] : [8, 4],
                    },
                })
                event.feature.changed()
            }

            if (isLineFirstDrawMode) {
                const geometry = event.feature.getGeometry()
                if (geometry instanceof Polygon) {
                    const lineCoordinates = getFeatureCoordinatesWithoutExtraPoint(event.feature)
                    if (lineIsSnappingOnFirstPoint && lineCoordinates.length >= 3) {
                        const normalizedLineCoordinates = lineCoordinates
                            .map((coordinate) => {
                                const x = coordinate[0]
                                const y = coordinate[1]
                                if (typeof x !== 'number' || typeof y !== 'number') {
                                    return null
                                }
                                return [x, y] as [number, number]
                            })
                            .filter(
                                (coordinate): coordinate is [number, number] => coordinate !== null
                            )

                        const firstPoint = normalizedLineCoordinates[0]
                        if (firstPoint && normalizedLineCoordinates.length >= 3) {
                            geometry.setCoordinates([
                                [...normalizedLineCoordinates, [firstPoint[0], firstPoint[1]]],
                            ])
                            drawingStore.updateFeatureAttributes(event.feature, { kind: 'Polygon' })
                            event.feature.changed()
                        }
                    } else {
                        event.feature.setGeometry(new LineString(lineCoordinates))
                        drawingStore.updateFeatureAttributes(event.feature, { kind: 'LineString' })
                        event.feature.changed()
                    }
                }
            }

            drawingStore.ensureFeatureAttributes(event.feature)

            // Notify that a feature was added (for UI updates like feature count)
            // No expensive KML conversion here - that happens only when closing the panel
            if (onFeatureAdded) {
                onFeatureAdded(event.feature)
            }

            lineSketchPointCount = 0
            lineIsSnappingOnFirstPoint = false
        })
        currentDraw.on('drawabort', () => {
            clearMeasurementGeometryListener()
            clearLineSketchListener()
            lineSketchPointCount = 0
            lineIsSnappingOnFirstPoint = false
            if (type === 'Measurement') {
                drawingStore.setMeasurementSubtype('Radius')
            }
        })

        olMap!.addInteraction(currentDraw)
    }

    /**
     * Stop the current drawing interaction
     */
    function stopDrawing() {
        if (currentDraw) {
            currentDraw.setActive(false) // Deactivate first
            olMap!.removeInteraction(currentDraw)
            currentDraw = null
            log.debug('Stopped drawing and removed interaction from map')
        } else {
            log.info({
                title: 'olDrawing Composable / stopDrawing',
                titleColor: LogPreDefinedColor.Yellow,
                messages: [`No draw interaction to remove`],
            })
        }
    }

    function getPixelToleranceInMapUnits(pixelTolerance = 10): number {
        const resolution = olMap!.getView().getResolution()
        if (typeof resolution !== 'number' || Number.isNaN(resolution)) {
            return 1
        }
        return resolution * pixelTolerance
    }

    function resolveNearestVertexIndex(
        coordinates: number[][],
        targetCoordinate: number[],
        toleranceInMapUnits: number
    ): number {
        const targetX = targetCoordinate[0]
        const targetY = targetCoordinate[1]
        if (typeof targetX !== 'number' || typeof targetY !== 'number') {
            return -1
        }

        let nearestIndex = -1
        let nearestDistance = Number.POSITIVE_INFINITY

        coordinates.forEach((coordinate, index) => {
            const coordinateX = coordinate[0]
            const coordinateY = coordinate[1]
            if (typeof coordinateX !== 'number' || typeof coordinateY !== 'number') {
                return
            }

            const dx = coordinateX - targetX
            const dy = coordinateY - targetY
            const distance = Math.hypot(dx, dy)
            if (distance <= toleranceInMapUnits && distance < nearestDistance) {
                nearestDistance = distance
                nearestIndex = index
            }
        })

        return nearestIndex
    }

    function deleteVertexAtCoordinate(feature: Feature<Geometry>, coordinate: number[]): boolean {
        const geometry = feature.getGeometry()
        if (!geometry) {
            return false
        }

        const toleranceInMapUnits = getPixelToleranceInMapUnits(12)

        if (geometry.getType() === 'LineString') {
            const lineGeometry = geometry as LineString
            const coordinates = lineGeometry.getCoordinates()
            const vertexIndex = resolveNearestVertexIndex(
                coordinates,
                coordinate,
                toleranceInMapUnits
            )

            if (vertexIndex < 0 || coordinates.length <= 2) {
                return false
            }

            const nextCoordinates = coordinates.filter((_, index) => index !== vertexIndex)
            lineGeometry.setCoordinates(nextCoordinates)
            syncMeasurementSubtypeFromGeometry(feature)
            feature.changed()
            return true
        }

        if (geometry.getType() === 'Polygon') {
            const polygonGeometry = geometry as Polygon
            const rings = polygonGeometry.getCoordinates()
            const exteriorRing = rings[0]
            if (!exteriorRing || exteriorRing.length < 4) {
                return false
            }

            const uniqueVertices = exteriorRing.slice(0, -1)
            if (uniqueVertices.length <= 3) {
                return false
            }

            const vertexIndex = resolveNearestVertexIndex(
                uniqueVertices,
                coordinate,
                toleranceInMapUnits
            )
            if (vertexIndex < 0) {
                return false
            }

            const nextUniqueVertices = uniqueVertices.filter((_, index) => index !== vertexIndex)
            if (nextUniqueVertices.length < 3) {
                return false
            }

            nextUniqueVertices.push([...nextUniqueVertices[0]!])
            const nextRings = [nextUniqueVertices, ...rings.slice(1)]
            polygonGeometry.setCoordinates(nextRings)
            feature.changed()
            return true
        }

        return false
    }

    function resolveNearestSegmentIndex(
        coordinates: number[][],
        targetCoordinate: number[],
        toleranceInMapUnits: number
    ): number {
        const targetX = targetCoordinate[0]
        const targetY = targetCoordinate[1]
        if (typeof targetX !== 'number' || typeof targetY !== 'number') {
            return -1
        }

        let nearestSegmentIndex = -1
        let nearestDistance = Number.POSITIVE_INFINITY

        for (let index = 0; index < coordinates.length - 1; index += 1) {
            const startCoordinate = coordinates[index]
            const endCoordinate = coordinates[index + 1]
            if (!startCoordinate || !endCoordinate) {
                continue
            }

            const startX = startCoordinate[0]
            const startY = startCoordinate[1]
            const endX = endCoordinate[0]
            const endY = endCoordinate[1]
            if (
                typeof startX !== 'number' ||
                typeof startY !== 'number' ||
                typeof endX !== 'number' ||
                typeof endY !== 'number'
            ) {
                continue
            }

            const segmentX = endX - startX
            const segmentY = endY - startY
            const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY
            if (segmentLengthSquared <= 0) {
                continue
            }

            const projection =
                ((targetX - startX) * segmentX + (targetY - startY) * segmentY) /
                segmentLengthSquared
            const clampedProjection = Math.min(1, Math.max(0, projection))

            const nearestPointX = startX + clampedProjection * segmentX
            const nearestPointY = startY + clampedProjection * segmentY
            const distance = Math.hypot(targetX - nearestPointX, targetY - nearestPointY)
            if (distance <= toleranceInMapUnits && distance < nearestDistance) {
                nearestDistance = distance
                nearestSegmentIndex = index
            }
        }

        return nearestSegmentIndex
    }

    function insertVertexAtCoordinate(feature: Feature<Geometry>, coordinate: number[]): boolean {
        const geometry = feature.getGeometry()
        if (!geometry) {
            return false
        }

        const toleranceInMapUnits = getPixelToleranceInMapUnits(12)

        if (geometry.getType() === 'LineString') {
            const lineGeometry = geometry as LineString
            const coordinates = lineGeometry.getCoordinates()

            const nearVertexIndex = resolveNearestVertexIndex(
                coordinates,
                coordinate,
                toleranceInMapUnits * 0.7
            )
            if (nearVertexIndex >= 0) {
                return false
            }

            const segmentIndex = resolveNearestSegmentIndex(
                coordinates,
                coordinate,
                toleranceInMapUnits
            )
            if (segmentIndex < 0) {
                return false
            }

            const nextCoordinates = [...coordinates]
            nextCoordinates.splice(segmentIndex + 1, 0, coordinate)
            lineGeometry.setCoordinates(nextCoordinates)
            syncMeasurementSubtypeFromGeometry(feature)
            feature.changed()
            return true
        }

        if (geometry.getType() === 'Polygon') {
            const polygonGeometry = geometry as Polygon
            const rings = polygonGeometry.getCoordinates()
            const exteriorRing = rings[0]
            if (!exteriorRing || exteriorRing.length < 4) {
                return false
            }

            const uniqueVertices = exteriorRing.slice(0, -1)
            const nearVertexIndex = resolveNearestVertexIndex(
                uniqueVertices,
                coordinate,
                toleranceInMapUnits * 0.7
            )
            if (nearVertexIndex >= 0) {
                return false
            }

            const closedCoordinates = [...uniqueVertices, uniqueVertices[0]!]
            const segmentIndex = resolveNearestSegmentIndex(
                closedCoordinates,
                coordinate,
                toleranceInMapUnits
            )
            if (segmentIndex < 0 || segmentIndex >= uniqueVertices.length) {
                return false
            }

            const nextUniqueVertices = [...uniqueVertices]
            nextUniqueVertices.splice(segmentIndex + 1, 0, coordinate)
            nextUniqueVertices.push([...nextUniqueVertices[0]!])

            const nextRings = [nextUniqueVertices, ...rings.slice(1)]
            polygonGeometry.setCoordinates(nextRings)
            feature.changed()
            return true
        }

        return false
    }

    function endpointHandleAtPixel(pixel: number[]): OlFeature<Point> | null {
        let selectedHandle: OlFeature<Point> | null = null

        olMap!.forEachFeatureAtPixel(
            pixel,
            (feature, targetLayer) => {
                if (targetLayer === endpointHandleLayer) {
                    selectedHandle = feature as OlFeature<Point>
                    return true
                }
                return false
            },
            {
                layerFilter: (candidateLayer) => candidateLayer === endpointHandleLayer,
                hitTolerance: 20,
            }
        )

        return selectedHandle
    }

    function endpointHandleNearCoordinate(
        coordinate: number[],
        pixelTolerance = 20
    ): OlFeature<Point> | null {
        const closestHandle = endpointHandleSource.getClosestFeatureToCoordinate(coordinate)
        if (!closestHandle) {
            return null
        }

        const geometry = closestHandle.getGeometry()
        if (!(geometry instanceof Point)) {
            return null
        }

        const handleCoordinate = geometry.getCoordinates()
        const handleX = handleCoordinate[0]
        const handleY = handleCoordinate[1]
        const targetX = coordinate[0]
        const targetY = coordinate[1]

        if (
            typeof handleX !== 'number' ||
            typeof handleY !== 'number' ||
            typeof targetX !== 'number' ||
            typeof targetY !== 'number'
        ) {
            return null
        }

        const toleranceInMapUnits = getPixelToleranceInMapUnits(pixelTolerance)
        const distance = Math.hypot(handleX - targetX, handleY - targetY)
        if (distance > toleranceInMapUnits) {
            return null
        }

        return closestHandle as OlFeature<Point>
    }

    function resolveOffsetEndpointHandleCoordinate(
        endpointCoordinate: number[],
        adjacentCoordinate: number[],
        pixelOffset = ENDPOINT_HANDLE_OFFSET_PIXELS
    ): number[] {
        const endpointX = endpointCoordinate[0]
        const endpointY = endpointCoordinate[1]
        const adjacentX = adjacentCoordinate[0]
        const adjacentY = adjacentCoordinate[1]

        if (
            typeof endpointX !== 'number' ||
            typeof endpointY !== 'number' ||
            typeof adjacentX !== 'number' ||
            typeof adjacentY !== 'number'
        ) {
            return endpointCoordinate
        }

        const directionX = endpointX - adjacentX
        const directionY = endpointY - adjacentY
        const directionLength = Math.hypot(directionX, directionY)
        if (directionLength <= 0) {
            return endpointCoordinate
        }

        const offsetDistance = getPixelToleranceInMapUnits(pixelOffset)
        const normalizedX = directionX / directionLength
        const normalizedY = directionY / directionLength

        return [endpointX + normalizedX * offsetDistance, endpointY + normalizedY * offsetDistance]
    }

    function rebuildEndpointHandles() {
        endpointHandleSource.clear(true)

        if (drawingStore.isDrawing && drawingStore.drawingMode !== 'None') {
            return
        }

        source.getFeatures().forEach((feature) => {
            const geometry = feature.getGeometry()
            if (!geometry || !feature.get('__isSelected')) {
                return
            }
            const geometryType = geometry.getType()
            if (geometryType !== 'LineString') {
                return
            }

            const featureId = resolveFeatureId(feature)

            if (geometryType === 'LineString') {
                const lineGeometry = geometry as LineString
                const coordinates = lineGeometry.getCoordinates()
                if (coordinates.length < 2) {
                    return
                }

                const firstCoordinate = coordinates[0]
                const secondCoordinate = coordinates[1]
                const penultimateCoordinate = coordinates[coordinates.length - 2]
                const lastCoordinate = coordinates[coordinates.length - 1]

                if (firstCoordinate && secondCoordinate) {
                    endpointHandleSource.addFeature(
                        new OlFeature({
                            geometry: new Point(
                                resolveOffsetEndpointHandleCoordinate(
                                    firstCoordinate,
                                    secondCoordinate
                                )
                            ),
                            __endpointHandle: true,
                            __drawingFeatureId: featureId,
                            __handleAction: 'append-start',
                        })
                    )
                }

                if (lastCoordinate && penultimateCoordinate) {
                    endpointHandleSource.addFeature(
                        new OlFeature({
                            geometry: new Point(
                                resolveOffsetEndpointHandleCoordinate(
                                    lastCoordinate,
                                    penultimateCoordinate
                                )
                            ),
                            __endpointHandle: true,
                            __drawingFeatureId: featureId,
                            __handleAction: 'append-end',
                        })
                    )
                }
            }
        })
    }

    function syncMeasurementSubtypeFromGeometry(feature: Feature<Geometry>) {
        const geometry = feature.getGeometry()
        if (!geometry || geometry.getType() !== 'LineString') {
            return
        }

        const featureKind = resolveFeatureKind(feature)
        if (featureKind !== 'MeasurementRadius' && featureKind !== 'MeasurementPath') {
            return
        }

        const coordinates = (geometry as LineString).getCoordinates()
        const measurementSubtype = coordinates.length >= 3 ? 'Path' : 'Radius'

        drawingStore.updateFeatureAttributes(feature, {
            kind: measurementSubtype === 'Path' ? 'MeasurementPath' : 'MeasurementRadius',
            measurementSubtype,
            style: {
                intervalKilometers:
                    measurementSubtype === 'Path'
                        ? DEFAULT_MEASUREMENT_PATH_INTERVAL_KILOMETERS
                        : DEFAULT_MEASUREMENT_INTERVAL_KILOMETERS,
                strokeColor: '#dc2626',
                strokeWidth: measurementSubtype === 'Path' ? 3 : 2,
                strokeOpacity: 1,
                dashPattern: measurementSubtype === 'Path' ? [10, 7] : [8, 4],
            },
        })
    }

    function maybeConvertLineToPolygon(feature: Feature<Geometry>) {
        const geometry = feature.getGeometry()
        if (!geometry || geometry.getType() !== 'LineString') {
            return
        }

        const featureKind = resolveFeatureKind(feature)
        if (featureKind === 'MeasurementRadius' || featureKind === 'MeasurementPath') {
            return
        }

        const lineGeometry = geometry as LineString
        const coordinates = lineGeometry.getCoordinates()
        if (coordinates.length < 3) {
            return
        }

        const firstCoordinate = coordinates[0]
        const lastCoordinate = coordinates[coordinates.length - 1]
        if (!firstCoordinate || !lastCoordinate) {
            return
        }

        const toleranceInMapUnits = getPixelToleranceInMapUnits(12)
        const firstX = firstCoordinate[0]
        const firstY = firstCoordinate[1]
        const lastX = lastCoordinate[0]
        const lastY = lastCoordinate[1]
        if (
            typeof firstX !== 'number' ||
            typeof firstY !== 'number' ||
            typeof lastX !== 'number' ||
            typeof lastY !== 'number'
        ) {
            return
        }

        const closureDistance = Math.hypot(firstX - lastX, firstY - lastY)
        if (closureDistance > toleranceInMapUnits) {
            return
        }

        const polygonRing = [...coordinates.slice(0, -1), [...firstCoordinate]]
        if (polygonRing.length < 4) {
            return
        }

        feature.setGeometry(new Polygon([polygonRing]))
        drawingStore.updateFeatureAttributes(feature, { kind: 'Polygon' })
        feature.changed()
    }

    function resetMapInteractionPointerState() {
        olMap!.getInteractions().forEach((interaction) => {
            if (
                interaction === currentDraw ||
                interaction === currentModify ||
                interaction === currentSnap
            ) {
                return
            }

            const wasActive = interaction.getActive()
            interaction.setActive(false)
            interaction.setActive(wasActive)
        })
    }

    function releaseViewportPointerState() {
        const viewport = olMap!.getViewport()
        viewport.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
        viewport.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))

        if (typeof PointerEvent !== 'undefined') {
            viewport.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
            viewport.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
        }
    }

    function disableDoubleClickZoomInteractionsTemporarily() {
        temporarilyDisabledDoubleClickZoomInteractions = []
        olMap!.getInteractions().forEach((interaction) => {
            if (!(interaction instanceof DoubleClickZoom) || !interaction.getActive()) {
                return
            }

            interaction.setActive(false)
            temporarilyDisabledDoubleClickZoomInteractions.push(interaction)
        })
    }

    function restoreDoubleClickZoomInteractions() {
        temporarilyDisabledDoubleClickZoomInteractions.forEach((interaction) => {
            interaction.setActive(true)
        })
        temporarilyDisabledDoubleClickZoomInteractions = []
    }

    function clearEndpointExtensionSnap() {
        if (endpointExtensionSnap) {
            endpointExtensionSnap.setActive(false)
            olMap!.removeInteraction(endpointExtensionSnap)
            endpointExtensionSnap = null
        }
    }

    function restoreActiveEditingAfterEndpointExtension(targetFeature: Feature<Geometry>) {
        if (reverseExtendedFeatureOnFinish) {
            const geometry = targetFeature.getGeometry()
            if (geometry && geometry.getType() === 'LineString') {
                const lineGeometry = geometry as LineString
                lineGeometry.setCoordinates([...lineGeometry.getCoordinates()].reverse())
            }
            reverseExtendedFeatureOnFinish = false
        }

        targetFeature.changed()
        maybeConvertLineToPolygon(targetFeature)
        applySelectionHighlight(targetFeature)

        if (currentDraw) {
            currentDraw.setActive(false)
            olMap!.removeInteraction(currentDraw)
            currentDraw = null
        }
        clearEndpointExtensionSnap()

        suppressNextActiveSingleClick = true
        suppressDoubleClickZoomUntil = Date.now() + 350
        releaseViewportPointerState()
        resetMapInteractionPointerState()
        olMap!.getViewport().style.cursor = ''

        window.setTimeout(() => {
            endpointExtensionInProgress = false
            restoreDoubleClickZoomInteractions()

            if (currentModify) {
                currentModify.setActive(true)
            }
            if (currentSnap) {
                currentSnap.setActive(true)
            }

            endpointHandleLayer.setVisible(true)
            rebuildEndpointHandles()
        }, 0)

        window.setTimeout(() => {
            suppressNextActiveSingleClick = false
        }, 200)
    }

    function startEndpointExtension(targetFeature: Feature<Geometry>, appendAtStart: boolean) {
        if (endpointExtensionInProgress) {
            return
        }

        const geometry = targetFeature.getGeometry()
        if (!geometry || geometry.getType() !== 'LineString') {
            return
        }
        const lineFeature = targetFeature as Feature<LineString>

        if (currentDraw) {
            stopDrawing()
        }
        clearEndpointExtensionSnap()

        if (appendAtStart) {
            const lineGeometry = geometry as LineString
            lineGeometry.setCoordinates([...lineGeometry.getCoordinates()].reverse())
            reverseExtendedFeatureOnFinish = true
        }

        const extensionRawStyle = targetFeature.get('style')
        const extensionStyleProps =
            extensionRawStyle && typeof extensionRawStyle === 'object'
                ? (extensionRawStyle as Record<string, unknown>)
                : ({} as Record<string, unknown>)
        const extensionStrokeColor =
            typeof extensionStyleProps.strokeColor === 'string' &&
            extensionStyleProps.strokeColor.length > 0
                ? extensionStyleProps.strokeColor
                : '#ff0000'
        const extensionStrokeWidth =
            typeof extensionStyleProps.strokeWidth === 'number' &&
            Number.isFinite(extensionStyleProps.strokeWidth)
                ? Math.max(1, extensionStyleProps.strokeWidth)
                : 2
        const extensionStrokeOpacity =
            typeof extensionStyleProps.strokeOpacity === 'number' &&
            Number.isFinite(extensionStyleProps.strokeOpacity)
                ? Math.min(Math.max(extensionStyleProps.strokeOpacity, 0), 1)
                : 1
        const extensionDashPattern =
            Array.isArray(extensionStyleProps.dashPattern) &&
            extensionStyleProps.dashPattern.every(
                (value) => typeof value === 'number' && Number.isFinite(value)
            )
                ? extensionStyleProps.dashPattern
                : undefined

        endpointExtensionInProgress = true
        disableDoubleClickZoomInteractionsTemporarily()
        endpointHandleLayer.setVisible(false)
        endpointHandleSource.clear(true)

        if (currentModify) {
            currentModify.getOverlay().getSource()?.clear(true)
            currentModify.setActive(false)
        }
        if (currentSnap) {
            currentSnap.setActive(false)
        }

        currentDraw = new Draw({
            source,
            type: 'LineString',
            stopClick: true,
            condition: (event) => primaryAction(event),
            style: (feature) => {
                const geometry = feature.getGeometry()
                if (!geometry) {
                    return undefined
                }

                if (geometry instanceof Point) {
                    return new Style({
                        image: new CircleStyle({
                            radius: 6,
                            fill: new Fill({ color: '#ffffff' }),
                            stroke: new Stroke({ color: '#111111', width: 1.5 }),
                        }),
                    })
                }

                if (!(geometry instanceof LineString)) {
                    return undefined
                }

                const coordinates = geometry.getCoordinates()
                if (coordinates.length === 0) {
                    return undefined
                }

                return [
                    new Style({
                        geometry,
                        stroke: new Stroke({
                            color: toRgbaColor(extensionStrokeColor, extensionStrokeOpacity),
                            width: extensionStrokeWidth,
                            lineDash: extensionDashPattern,
                        }),
                    }),
                    new Style({
                        geometry: new MultiPoint(coordinates.map((coordinate) => [...coordinate])),
                        image: new CircleStyle({
                            radius: 6,
                            fill: new Fill({ color: '#ffffff' }),
                            stroke: new Stroke({ color: '#111111', width: 1.5 }),
                        }),
                    }),
                ]
            },
        })

        endpointExtensionSnap = new Snap({
            source,
        })

        currentDraw.on('drawend', () => {
            restoreActiveEditingAfterEndpointExtension(targetFeature)
        })

        olMap!.addInteraction(currentDraw)
        olMap!.addInteraction(endpointExtensionSnap)
        currentDraw.extend(lineFeature)
    }

    function enableActiveEditing() {
        disableActiveEditing()

        currentModify = new Modify({
            source,
            pixelTolerance: 10,
        })
        currentSnap = new Snap({
            source,
        })

        olMap!.addInteraction(currentModify)
        olMap!.addInteraction(currentSnap)
        endpointHandleLayer.setVisible(true)
        rebuildEndpointHandles()

        activeFeatureAddListener = source.on('addfeature', () => {
            rebuildEndpointHandles()
        })
        activeFeatureRemoveListener = source.on('removefeature', () => {
            rebuildEndpointHandles()
        })

        activeModifyEndListener = currentModify.on('modifyend', (event) => {
            event.features.forEach((feature) => {
                maybeConvertLineToPolygon(feature)
                syncMeasurementSubtypeFromGeometry(feature)
                feature.changed()
            })
            rebuildEndpointHandles()
        })

        activeClickListener = olMap!.on('singleclick', (event) => {
            if (suppressNextActiveSingleClick) {
                return
            }

            if (endpointExtensionInProgress) {
                return
            }

            const handleFeature =
                endpointHandleAtPixel(event.pixel) ?? endpointHandleNearCoordinate(event.coordinate)
            if (handleFeature) {
                const targetFeatureId = String(handleFeature.get('__drawingFeatureId') ?? '')
                const handleAction = String(handleFeature.get('__handleAction') ?? '')
                if (!targetFeatureId) {
                    return
                }

                const targetFeature = source
                    .getFeatures()
                    .find((feature) => resolveFeatureId(feature) === targetFeatureId)

                if (!targetFeature) {
                    return
                }

                if (handleAction === 'append-start') {
                    startEndpointExtension(targetFeature, true)
                } else if (handleAction === 'append-end') {
                    startEndpointExtension(targetFeature, false)
                }

                applySelectionHighlight(targetFeature)
                rebuildEndpointHandles()
                return
            }

            const targetFeature = featureAtPixel(event.pixel)
            if (!targetFeature) {
                applySelectionHighlight(null)
                rebuildEndpointHandles()
                return
            }

            const wasSelected = Boolean(targetFeature.get('__isSelected'))
            applySelectionHighlight(targetFeature)

            if (!wasSelected) {
                rebuildEndpointHandles()
                return
            }

            insertVertexAtCoordinate(targetFeature, event.coordinate)
            rebuildEndpointHandles()
        })

        activeMoveListener = olMap!.on('pointermove', (event) => {
            if (!currentModify) {
                return
            }

            const hoveredFeature = featureAtPixel(event.pixel)
            const isEditableGeometry =
                hoveredFeature?.getGeometry()?.getType() === 'LineString' ||
                hoveredFeature?.getGeometry()?.getType() === 'Polygon'

            if (!isEditableGeometry) {
                currentModify.getOverlay().getSource()?.clear(true)
            }
        })

        const viewport = olMap!.getViewport()
        activeViewportDblClickListener = (event: MouseEvent) => {
            if (endpointExtensionInProgress && currentDraw) {
                currentDraw.finishDrawing()
                suppressDoubleClickZoomUntil = Date.now() + 350
            }

            if (!endpointExtensionInProgress && Date.now() > suppressDoubleClickZoomUntil) {
                return
            }

            event.preventDefault()
            event.stopPropagation()
        }
        viewport.addEventListener('dblclick', activeViewportDblClickListener)

        activeContextMenuListener = (event: MouseEvent) => {
            event.preventDefault()

            const viewportRect = viewport.getBoundingClientRect()
            const pixel = [event.clientX - viewportRect.left, event.clientY - viewportRect.top]
            const targetFeature = featureAtPixel(pixel)
            if (!targetFeature) {
                return
            }

            const coordinate = olMap!.getCoordinateFromPixel(pixel)
            if (!coordinate) {
                return
            }

            if (deleteVertexAtCoordinate(targetFeature, coordinate)) {
                rebuildEndpointHandles()
            }
        }
        viewport.addEventListener('contextmenu', activeContextMenuListener)
    }

    function disableActiveEditing() {
        endpointExtensionInProgress = false
        reverseExtendedFeatureOnFinish = false
        restoreDoubleClickZoomInteractions()

        if (activeClickListener) {
            unByKey(activeClickListener)
            activeClickListener = null
        }

        if (activeMoveListener) {
            unByKey(activeMoveListener)
            activeMoveListener = null
        }

        if (activeModifyEndListener) {
            unByKey(activeModifyEndListener)
            activeModifyEndListener = null
        }

        if (activeDblClickListener) {
            unByKey(activeDblClickListener)
            activeDblClickListener = null
        }

        if (activeFeatureAddListener) {
            unByKey(activeFeatureAddListener)
            activeFeatureAddListener = null
        }

        if (activeFeatureRemoveListener) {
            unByKey(activeFeatureRemoveListener)
            activeFeatureRemoveListener = null
        }

        if (activeContextMenuListener) {
            olMap!.getViewport().removeEventListener('contextmenu', activeContextMenuListener)
            activeContextMenuListener = null
        }

        if (activeViewportDblClickListener) {
            olMap!.getViewport().removeEventListener('dblclick', activeViewportDblClickListener)
            activeViewportDblClickListener = null
        }

        if (currentModify) {
            currentModify.setActive(false)
            currentModify.getOverlay().getSource()?.clear(true)
            olMap!.removeInteraction(currentModify)
            currentModify = null
        }

        if (currentSnap) {
            currentSnap.setActive(false)
            olMap!.removeInteraction(currentSnap)
            currentSnap = null
        }

        clearEndpointExtensionSnap()

        endpointHandleLayer.setVisible(false)
        endpointHandleSource.clear(true)
    }

    function resolveFeatureId(feature: Feature<Geometry>): string {
        const existingFeatureId = feature.getId()
        if (typeof existingFeatureId === 'string') {
            return existingFeatureId
        }

        const runtimeFeatureId = String(feature.get('__drawingFeatureId') ?? getUid(feature))
        feature.set('__drawingFeatureId', runtimeFeatureId, true)
        return runtimeFeatureId
    }

    function resolveFeatureKind(feature: Feature<Geometry>): DrawingFeatureKind {
        return resolveDrawingFeatureKind(feature) as DrawingFeatureKind
    }

    function resolveHoverTargetLabel(feature: Feature<Geometry>): string {
        const kind = resolveFeatureKind(feature)
        if (kind === 'Point') {
            return translateUi('debug.drawingHoverHint.targetMarker')
        }
        if (kind === 'Text') {
            return translateUi('debug.drawingHoverHint.targetText')
        }
        if (kind === 'LineString') {
            return translateUi('debug.drawingHoverHint.targetLine')
        }
        if (kind === 'Polygon') {
            return translateUi('debug.drawingHoverHint.targetPolygon')
        }
        if (kind === 'MeasurementRadius' || kind === 'MeasurementPath') {
            return translateUi('debug.drawingHoverHint.targetMeasurement')
        }
        return translateUi('debug.drawingHoverHint.targetFeature')
    }

    function featureAtPixel(pixel: number[]): Feature<Geometry> | null {
        let selectedFeature: Feature<Geometry> | null = null

        olMap!.forEachFeatureAtPixel(
            pixel,
            (feature, targetLayer) => {
                if (targetLayer === layer) {
                    selectedFeature = feature as Feature<Geometry>
                    return true
                }
                return false
            },
            {
                layerFilter: (candidateLayer) => candidateLayer === layer,
                hitTolerance: 6,
            }
        )

        return selectedFeature
    }

    function applySelectionHighlight(selectedFeature: Feature<Geometry> | null) {
        const selectedFeatureId = selectedFeature ? resolveFeatureId(selectedFeature) : null

        source.getFeatures().forEach((feature) => {
            const isSelected =
                selectedFeatureId !== null && resolveFeatureId(feature) === selectedFeatureId
            if (Boolean(feature.get('__isSelected')) !== isSelected) {
                feature.set('__isSelected', isSelected, true)
                feature.changed()
            }
        })
    }

    function toHoverHintPayload(
        clientX: number,
        clientY: number,
        feature: Feature<Geometry> | null
    ): DrawingHoverHintPayload {
        const hintText = feature
            ? translateUi('debug.drawingHoverHint.selectFeature', {
                  target: resolveHoverTargetLabel(feature),
              })
            : translateUi('debug.drawingHoverHint.nothingToSelect')

        return {
            x: clientX + 14,
            y: clientY + 8,
            text: hintText,
        }
    }

    function toFeatureInfoPayload(
        feature: Feature<Geometry>,
        coordinate: number[]
    ): DrawingFeatureInfoPayload {
        const geometry = feature.getGeometry()
        const geometryType = geometry?.getType() ?? 'Unknown'

        let resolvedCoordinate: number[] | undefined = undefined
        let area: number | undefined = undefined
        let perimeter: number | undefined = undefined

        if (geometry instanceof Point) {
            resolvedCoordinate = geometry.getCoordinates()
        }

        if (geometry instanceof Polygon) {
            area = geometry.getArea()
            const rings = geometry.getCoordinates()
            const exteriorRing = rings[0]

            if (exteriorRing && exteriorRing.length > 1) {
                let ringLength = 0
                for (let index = 1; index < exteriorRing.length; index += 1) {
                    const previousCoordinate = exteriorRing[index - 1]
                    const currentCoordinate = exteriorRing[index]

                    if (!previousCoordinate || !currentCoordinate) {
                        continue
                    }

                    const prevX = previousCoordinate[0]
                    const prevY = previousCoordinate[1]
                    const currX = currentCoordinate[0]
                    const currY = currentCoordinate[1]

                    if (
                        typeof prevX !== 'number' ||
                        typeof prevY !== 'number' ||
                        typeof currX !== 'number' ||
                        typeof currY !== 'number'
                    ) {
                        continue
                    }

                    const dx = currX - prevX
                    const dy = currY - prevY
                    ringLength += Math.hypot(dx, dy)
                }
                perimeter = ringLength
            }
        }

        return {
            featureId: resolveFeatureId(feature),
            kind: resolveFeatureKind(feature),
            title: String(feature.get('title') ?? ''),
            description: String(feature.get('description') ?? ''),
            text: String(feature.get('text') ?? ''),
            geometryType,
            coordinate: resolvedCoordinate ?? coordinate,
            area,
            perimeter,
        }
    }

    function enablePassiveInspection(
        onFeatureSelected?: (payload: DrawingFeatureInfoPayload | null) => void,
        onHoverHintChanged?: (payload: DrawingHoverHintPayload | null) => void
    ) {
        disablePassiveInspection()

        passiveClickListener = olMap!.on('singleclick', (event) => {
            if (
                endpointHandleAtPixel(event.pixel) ||
                endpointHandleNearCoordinate(event.coordinate)
            ) {
                return
            }

            const selectedFeature = featureAtPixel(event.pixel)

            if (!selectedFeature) {
                applySelectionHighlight(null)
                onFeatureSelected?.(null)
                return
            }

            applySelectionHighlight(selectedFeature)
            const payload = toFeatureInfoPayload(selectedFeature, event.coordinate)
            onFeatureSelected?.(payload)
        })

        passiveMoveListener = olMap!.on('pointermove', (event) => {
            if (!event.originalEvent) {
                return
            }

            const hoveredFeature = featureAtPixel(event.pixel)
            olMap!.getViewport().style.cursor = hoveredFeature ? 'pointer' : ''
            const pointerEvent = event.originalEvent as PointerEvent
            const payload = toHoverHintPayload(
                pointerEvent.clientX,
                pointerEvent.clientY,
                hoveredFeature
            )
            onHoverHintChanged?.(payload)
        })

        const viewport = olMap!.getViewport()
        passiveOutListener = () => {
            olMap!.getViewport().style.cursor = ''
            onHoverHintChanged?.(null)
        }
        viewport.addEventListener('pointerleave', passiveOutListener)
    }

    function disablePassiveInspection() {
        applySelectionHighlight(null)

        if (passiveClickListener) {
            unByKey(passiveClickListener)
            passiveClickListener = null
        }

        if (passiveMoveListener) {
            unByKey(passiveMoveListener)
            passiveMoveListener = null
        }

        if (passiveOutListener) {
            olMap!.getViewport().removeEventListener('pointerleave', passiveOutListener)
            passiveOutListener = null
        }

        olMap!.getViewport().style.cursor = ''
    }

    /**
     * Get all features from the drawing source
     */
    function getFeatures(): Feature<Geometry>[] {
        return source.getFeatures()
    }

    /**
     * Clear all features from the drawing
     */
    function clearFeatures() {
        source.clear()
        log.debug('Cleared all features')
    }

    /**
     * Add features to the drawing source
     */
    function addFeatures(features: Feature<Geometry>[]) {
        features.forEach((feature) => {
            drawingStore.ensureFeatureAttributes(feature)
        })
        source.addFeatures(features)
        log.debug(`Added ${features.length} features to drawing`)
    }

    /**
     * Set the visibility of the drawing layer
     */
    function setVisibility(isVisible: boolean) {
        layer.setVisible(isVisible)
    }

    /**
     * Set the z-index of the drawing layer
     */
    function setZIndex(zIndex: number) {
        layer.setZIndex(zIndex)
    }

    /**
     * Update the text of a feature
     */
    function updateFeatureText(feature: Feature<Geometry>, text: string) {
        feature.set('text', text)
        feature.changed()
        log.debug('Updated feature text:', text)
    }

    /**
     * Set the icon to use for new point features
     */
    function setSelectedIcon(icon: MarkerIcon) {
        selectedIcon.value = icon
        log.debug('Selected icon:', icon.id)
    }

    return {
        layer,
        source,
        startDrawing,
        stopDrawing,
        enableActiveEditing,
        disableActiveEditing,
        getFeatures,
        clearFeatures,
        addFeatures,
        setVisibility,
        setZIndex,
        updateFeatureText,
        setSelectedIcon,
        enablePassiveInspection,
        disablePassiveInspection,
        selectedIcon: readonly(selectedIcon),
    }
}
