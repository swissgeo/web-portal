import type { StylePropertyKey } from '@swissgeo/shared'
import type { Feature } from 'ol'
import type { Geometry } from 'ol/geom'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import {
    EPSG_4326_WGS84,
    EPSG_2056_CH1903,
    resolveDrawingFeatureKind,
    resolveColoredSvgDataUrl,
    safeParseStyleObject,
    STYLE_PROPERTY_KEYS,
    toRgbaColor,
} from '@swissgeo/shared'
import { zip } from 'fflate'
import GPX from 'ol/format/GPX'
import KML from 'ol/format/KML'
import { Fill, Icon, Stroke, Style } from 'ol/style'
import { getUid } from 'ol/util'

import type {
    DrawingFeatureAttributes,
    DrawingFeatureKind,
    DrawingFeatureStyleProps,
    DrawingMode,
    MeasurementDrawingSubtype,
} from '@/types'

import { dataUrlToUint8Array, getMarkerIconById, MARKER_ICONS } from '@/utils/markerIcons'

export const DEFAULT_DRAWING_NAME = 'My Drawings'
export const DRAWING_DESCRIPTION = 'User-created drawings on the map'

interface FeatureContext {
    drawingMode: DrawingMode
    measurementSubtype: MeasurementDrawingSubtype
}

function escapeXml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;')
}

export function sanitizeDrawingName(value: string): string {
    const normalizedName = value.trim()
    return normalizedName.length > 0 ? normalizedName : DEFAULT_DRAWING_NAME
}

export function resolveFeatureId(feature: Feature<Geometry>): string {
    const existingFeatureId = feature.getId()
    if (typeof existingFeatureId === 'string') {
        return existingFeatureId
    }

    const runtimeFeatureId = String(feature.get('__drawingFeatureId') ?? getUid(feature))
    feature.set('__drawingFeatureId', runtimeFeatureId, true)
    return runtimeFeatureId
}

export function withKmlDocumentMetadata(kmlString: string, drawingName: string): string {
    const safeName = escapeXml(drawingName)
    const safeDescription = escapeXml(DRAWING_DESCRIPTION)

    const documentStart = kmlString.indexOf('<Document')
    if (documentStart !== -1) {
        const documentOpenEnd = kmlString.indexOf('>', documentStart)
        if (documentOpenEnd !== -1) {
            const documentClose = kmlString.indexOf('</Document>', documentOpenEnd)
            if (documentClose !== -1) {
                const documentBody = kmlString.slice(documentOpenEnd + 1, documentClose)
                let withoutDocumentMetadata = documentBody
                let hasLeadingMetadata = true
                while (hasLeadingMetadata) {
                    const next = withoutDocumentMetadata.replace(
                        /^\s*<(name|description)>[\s\S]*?<\/\1>\s*/,
                        ''
                    )
                    hasLeadingMetadata = next !== withoutDocumentMetadata
                    withoutDocumentMetadata = next
                }
                const metadataBlock = `<name>${safeName}</name><description>${safeDescription}</description>`
                return `${kmlString.slice(0, documentOpenEnd + 1)}${metadataBlock}${withoutDocumentMetadata}${kmlString.slice(documentClose)}`
            }
        }
    }

    const kmlOpenMatch = kmlString.match(/^<kml[^>]*>/)
    if (!kmlOpenMatch) {
        return kmlString
    }

    const kmlOpenTag = kmlOpenMatch[0]
    const kmlOpenEnd = kmlString.indexOf('>') + 1
    const kmlClose = kmlString.lastIndexOf('</kml>')

    if (kmlClose === -1) {
        return kmlString
    }

    const innerContent = kmlString.slice(kmlOpenEnd, kmlClose)
    return `${kmlOpenTag}<Document><name>${safeName}</name><description>${safeDescription}</description>${innerContent}</Document></kml>`
}

export function withGpxMetadata(gpxString: string, drawingName: string): string {
    const safeName = escapeXml(drawingName)
    const safeDescription = escapeXml(DRAWING_DESCRIPTION)
    const metadataBlock = `<metadata><name>${safeName}</name><desc>${safeDescription}</desc></metadata>`

    if (/<metadata>[\s\S]*?<\/metadata>/.test(gpxString)) {
        return gpxString.replace(/<metadata>[\s\S]*?<\/metadata>/, metadataBlock)
    }

    return gpxString.replace(/<gpx([^>]*)>/, `<gpx$1>${metadataBlock}`)
}

export function extractDrawingNameFromKML(kmlString: string): string | null {
    const documentMatch = kmlString.match(/<Document[\s\S]*?<name>([\s\S]*?)<\/name>/)
    if (!documentMatch || !documentMatch[1]) {
        return null
    }
    return documentMatch[1].trim() || null
}

export function createEmptyDrawingKML(drawingName: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
                <kml xmlns="http://www.opengis.net/kml/2.2">
                <Document>
                    <name>${escapeXml(drawingName)}</name>
                    <description>${escapeXml(DRAWING_DESCRIPTION)}</description>
                </Document>
                </kml>`
}

function toStyleRecord(style: DrawingFeatureStyleProps): Record<string, unknown> {
    return style as Record<string, unknown>
}

function safeParseStyle(value: unknown): DrawingFeatureStyleProps {
    return safeParseStyleObject(value) as DrawingFeatureStyleProps
}

function createGeometryStyle(
    geometryType: string | undefined,
    styleProps: DrawingFeatureStyleProps
): Style {
    const styleRecord = toStyleRecord(styleProps)
    const strokeColor =
        typeof styleRecord.strokeColor === 'string' && styleRecord.strokeColor.length > 0
            ? styleRecord.strokeColor
            : '#ff0000'

    const strokeWidth =
        typeof styleRecord.strokeWidth === 'number' && Number.isFinite(styleRecord.strokeWidth)
            ? Math.max(1, styleRecord.strokeWidth)
            : 2

    const strokeOpacity =
        typeof styleRecord.strokeOpacity === 'number' && Number.isFinite(styleRecord.strokeOpacity)
            ? Math.min(Math.max(styleRecord.strokeOpacity, 0), 1)
            : 1

    const dashPattern =
        Array.isArray(styleRecord.dashPattern) &&
        styleRecord.dashPattern.every(
            (value) => typeof value === 'number' && Number.isFinite(value)
        )
            ? (styleRecord.dashPattern as number[])
            : undefined

    const fillColor =
        typeof styleRecord.fillColor === 'string' && styleRecord.fillColor.length > 0
            ? styleRecord.fillColor
            : '#ff0000'

    const fillOpacity =
        typeof styleRecord.fillOpacity === 'number' && Number.isFinite(styleRecord.fillOpacity)
            ? Math.min(Math.max(styleRecord.fillOpacity, 0), 1)
            : 0.2

    return new Style({
        stroke: new Stroke({
            color: toRgbaColor(strokeColor, strokeOpacity),
            width: strokeWidth,
            lineDash: dashPattern,
        }),
        fill:
            geometryType === 'Polygon'
                ? new Fill({ color: toRgbaColor(fillColor, fillOpacity) })
                : undefined,
    })
}

export function resolveFeatureKind(
    feature: Feature<Geometry>,
    context: FeatureContext
): DrawingFeatureKind {
    const sharedKind = resolveDrawingFeatureKind(feature)
    if (sharedKind !== 'Unknown') {
        return sharedKind as DrawingFeatureKind
    }

    if (context.drawingMode === 'Measurement') {
        return context.measurementSubtype === 'Radius' ? 'MeasurementRadius' : 'MeasurementPath'
    }

    const geometryType = feature.getGeometry()?.getType()
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

export function resolveFeatureStyle(feature: Feature<Geometry>): DrawingFeatureStyleProps {
    const styleFromFeature = safeParseStyle(feature.get('style'))
    const styleFromSerialized = safeParseStyle(feature.get('drawingStyle'))

    const mergedStyle: DrawingFeatureStyleProps = {
        ...styleFromSerialized,
        ...styleFromFeature,
    }

    STYLE_PROPERTY_KEYS.forEach((propertyKey) => {
        const propertyValue = feature.get(propertyKey)
        if (propertyValue !== undefined && propertyValue !== null) {
            ;(mergedStyle as Record<StylePropertyKey, unknown>)[propertyKey] = propertyValue
        }
    })

    return mergedStyle
}

export function applyStyleProperties(
    feature: Feature<Geometry>,
    style: DrawingFeatureStyleProps,
    silent = true
) {
    const styleRecord = toStyleRecord(style)

    STYLE_PROPERTY_KEYS.forEach((propertyKey) => {
        const propertyValue = styleRecord[propertyKey]
        if (propertyValue === undefined || propertyValue === null || propertyValue === '') {
            feature.unset(propertyKey, silent)
            return
        }

        feature.set(propertyKey, propertyValue, silent)
    })

    feature.set('style', style, silent)
    feature.set('drawingStyle', JSON.stringify(style), silent)
}

export function ensureFeatureAttributes(
    feature: Feature<Geometry>,
    context: FeatureContext
): DrawingFeatureAttributes {
    const kind = resolveFeatureKind(feature, context)
    const title = typeof feature.get('title') === 'string' ? String(feature.get('title')) : ''
    const description =
        typeof feature.get('description') === 'string' ? String(feature.get('description')) : ''
    const isDescriptionVisible = Boolean(feature.get('isDescriptionVisible'))
    const isVisible = feature.get('isVisible') !== false
    const style = resolveFeatureStyle(feature)

    const attributes: DrawingFeatureAttributes = {
        kind,
        title,
        description,
        isDescriptionVisible,
        isVisible,
        style,
    }

    if (kind === 'MeasurementRadius') {
        attributes.measurementSubtype = 'Radius'
    }
    if (kind === 'MeasurementPath') {
        attributes.measurementSubtype = 'Path'
    }

    feature.setProperties(attributes, true)
    applyStyleProperties(feature, style)
    return attributes
}

export function updateFeatureAttributes(
    feature: Feature<Geometry>,
    attributes: Partial<DrawingFeatureAttributes>,
    context: FeatureContext
) {
    const currentAttributes = ensureFeatureAttributes(feature, context)
    const nextStyle: DrawingFeatureStyleProps = {
        ...currentAttributes.style,
        ...(attributes.style ?? {}),
    }

    const nextAttributes: DrawingFeatureAttributes = {
        ...currentAttributes,
        ...attributes,
        style: nextStyle,
    }

    feature.setProperties(nextAttributes, true)
    applyStyleProperties(feature, nextStyle)
    feature.changed()
}

export function featuresToKML(
    features: Feature<Geometry>[],
    drawingName: string,
    context: FeatureContext
): string {
    if (features.length === 0) {
        return createEmptyDrawingKML(drawingName)
    }

    const format = new KML({
        extractStyles: true,
    })

    const clonedFeatures = features.map((feature) => {
        const clone = feature.clone()
        clone.unset('__isSelected', true)
        clone.set('drawingName', drawingName)
        const cloneAttributes = ensureFeatureAttributes(clone, context)
        applyStyleProperties(clone, cloneAttributes.style)

        const textContent = feature.get('text')
        if (textContent) {
            clone.set('name', textContent)
            clone.set('text', textContent)
            clone.set('isTextFeature', true)
            clone.setStyle(undefined)
        } else {
            const styleRecord = toStyleRecord(cloneAttributes.style)
            const iconId = styleRecord.iconId ?? feature.get('iconId')
            const iconColor = styleRecord.iconColor
            const iconSize = Number(styleRecord.iconSize ?? 1)
            const geomType = feature.getGeometry()?.getType()

            if (geomType === 'Point' && iconId) {
                const icon = getMarkerIconById(String(iconId))
                if (icon) {
                    const resolvedIconSrc =
                        typeof iconColor === 'string' && iconColor.length > 0
                            ? resolveColoredSvgDataUrl(icon.dataUrl, iconColor)
                            : icon.dataUrl
                    const iconStyle = new Style({
                        image: new Icon({
                            src: resolvedIconSrc,
                            scale: Number.isFinite(iconSize) && iconSize > 0 ? iconSize : 1,
                            anchor: icon.anchor,
                            anchorXUnits: 'fraction',
                            anchorYUnits: 'fraction',
                        }),
                    })
                    clone.setStyle(iconStyle)
                    clone.set('iconId', String(iconId))
                    clone.set('iconHref', resolvedIconSrc)
                    clone.set('iconAnchorX', icon.anchor[0] ?? 0.5)
                    clone.set('iconAnchorY', icon.anchor[1] ?? 1)
                }
            } else {
                clone.setStyle(createGeometryStyle(geomType, cloneAttributes.style))
            }
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

export function serializeFeaturesToKML(
    features: Feature<Geometry>[],
    drawingName: string,
    context: FeatureContext
): string {
    const kml = featuresToKML(features, drawingName, context)
    return withKmlDocumentMetadata(kml, drawingName)
}

export function exportFeaturesToKMLBlob(
    features: Feature<Geometry>[],
    drawingName: string,
    context: FeatureContext
): Blob {
    const kmlString = serializeFeaturesToKML(features, drawingName, context)
    return new Blob([kmlString], { type: 'application/vnd.google-earth.kml+xml' })
}

export async function exportFeaturesToKMZBlob(
    features: Feature<Geometry>[],
    drawingName: string,
    context: FeatureContext
): Promise<Blob> {
    const kmlString = serializeFeaturesToKML(features, drawingName, context)

    const usedIconIds = new Set<string>()
    features.forEach((feature) => {
        const attributes = ensureFeatureAttributes(feature, context)
        const styleRecord = toStyleRecord(attributes.style)
        const iconId = styleRecord.iconId ?? feature.get('iconId')
        if (iconId) {
            usedIconIds.add(String(iconId))
        }
    })

    if (usedIconIds.size === 0) {
        const kmlData = new TextEncoder().encode(kmlString)
        return new Promise((resolve, reject) => {
            zip({ 'doc.kml': kmlData }, { level: 6 }, (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(
                        new Blob([new Uint8Array(data)], {
                            type: 'application/vnd.google-earth.kmz',
                        })
                    )
                }
            })
        })
    }

    let modifiedKML = kmlString
    MARKER_ICONS.forEach((icon) => {
        if (usedIconIds.has(icon.id)) {
            modifiedKML = modifiedKML.split(icon.dataUrl).join(`icons/${icon.id}.svg`)
        }
    })

    const kmlData = new TextEncoder().encode(modifiedKML)
    const files: Record<string, Uint8Array> = { 'doc.kml': kmlData }

    for (const iconId of usedIconIds) {
        const icon = MARKER_ICONS.find((markerIcon) => markerIcon.id === iconId)
        if (icon) {
            try {
                const iconData = await dataUrlToUint8Array(icon.dataUrl)
                files[`icons/${icon.id}.svg`] = iconData
            } catch (error) {
                log.error({
                    title: 'drawingUtils / exportFeaturesToKMZBlob',
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
                resolve(
                    new Blob([new Uint8Array(data)], { type: 'application/vnd.google-earth.kmz' })
                )
            }
        })
    })
}

export function exportFeaturesToGPXBlob(features: Feature<Geometry>[], drawingName: string): Blob {
    const validFeatures = features.filter((feature) => {
        const geomType = feature.getGeometry()?.getType()
        const isText = feature.get('text')
        return (
            !isText &&
            (geomType === 'Point' || geomType === 'LineString' || geomType === 'MultiLineString')
        )
    })

    if (validFeatures.length === 0) {
        const emptyGPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SwissGeo Portal" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
</gpx>`
        return new Blob([withGpxMetadata(emptyGPX, drawingName)], {
            type: 'application/gpx+xml',
        })
    }

    const format = new GPX()

    const clonedFeatures = validFeatures.map((feature) => {
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

    return new Blob([withGpxMetadata(gpxString, drawingName)], {
        type: 'application/gpx+xml',
    })
}
