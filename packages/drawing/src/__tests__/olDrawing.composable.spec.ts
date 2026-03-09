import type BaseEvent from 'ol/events/Event'
import type { Geometry } from 'ol/geom'
import type * as OlObservable from 'ol/Observable'

import { mount } from '@vue/test-utils'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import Point from 'ol/geom/Point'
import Draw from 'ol/interaction/Draw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { useOlDrawing } from '../composables/olDrawing.composable'

const { drawingStoreMock, defaultMarkerIcon } = vi.hoisted(() => ({
    drawingStoreMock: {
        isDrawing: false,
        drawingMode: 'None',
        setOlLayer: vi.fn(),
        setMeasurementSubtype: vi.fn(),
        updateFeatureAttributes: vi.fn(),
        ensureFeatureAttributes: vi.fn(),
    },
    defaultMarkerIcon: {
        id: 'default-pin',
        name: 'Default Pin',
        dataUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
        width: 32,
        height: 48,
        anchor: [0.5, 1] as [number, number],
    },
}))

vi.mock('@/stores/drawing', () => ({
    useDrawingStore: vi.fn(() => drawingStoreMock),
}))

vi.mock('@/utils/markerIcons', () => ({
    DEFAULT_MARKER_ICON: defaultMarkerIcon,
    getMarkerIconById: vi.fn((id: string) =>
        id === 'known-icon'
            ? {
                  ...defaultMarkerIcon,
                  id: 'known-icon',
              }
            : undefined
    ),
}))

vi.mock('@swissgeo/log', () => ({
    default: {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
    LogPreDefinedColor: {
        Yellow: 'Yellow',
    },
}))

vi.mock('@swissgeo/shared', () => ({
    bearingBetweenCoordinates: vi.fn(() => null),
    DEFAULT_MEASUREMENT_INTERVAL_KILOMETERS: 5,
    DEFAULT_MEASUREMENT_PATH_INTERVAL_KILOMETERS: 10,
    formatDistanceKilometers: vi.fn((meters: number) => `${(meters / 1000).toFixed(2)} km`),
    resolveDrawingFeatureKind: vi.fn(
        (feature: Feature<Geometry>) => feature.get('kind') ?? 'Unknown'
    ),
    resolvePointLabelAnchor: vi.fn(() => ({
        textAlign: 'center',
        offsetX: 0,
        offsetY: 0,
    })),
    toMeasurementLabelStyle: vi.fn(() => undefined),
    toRgbaColor: vi.fn((color: string) => color),
}))

vi.mock('ol/Observable', async () => {
    const actual = await vi.importActual<typeof OlObservable>('ol/Observable')
    return {
        ...actual,
        unByKey: vi.fn(),
    }
})

type MapHit = {
    feature: Feature<Geometry>
    layer: unknown
}

type MockMap = {
    addLayer: ReturnType<typeof vi.fn>
    removeLayer: ReturnType<typeof vi.fn>
    addInteraction: ReturnType<typeof vi.fn>
    removeInteraction: ReturnType<typeof vi.fn>
    on: ReturnType<typeof vi.fn>
    getViewport: () => HTMLDivElement
    getView: () => { getResolution: () => number }
    getInteractions: () => unknown[]
    forEachFeatureAtPixel: ReturnType<typeof vi.fn>
    getCoordinateFromPixel: ReturnType<typeof vi.fn>
    __emit: (_type: string, _event: unknown) => void
    __setHit: (_hit: MapHit | null) => void
    __interactions: unknown[]
}

function createMapMock(): MockMap {
    const viewport = document.createElement('div')
    document.body.appendChild(viewport)

    const interactions: unknown[] = []
    const listeners = new Map<string, ((_event: unknown) => void)[]>()
    let hit: MapHit | null = null

    const map: MockMap = {
        addLayer: vi.fn(),
        removeLayer: vi.fn(),
        addInteraction: vi.fn((interaction: unknown) => {
            interactions.push(interaction)
        }),
        removeInteraction: vi.fn((interaction: unknown) => {
            const index = interactions.indexOf(interaction)
            if (index >= 0) {
                interactions.splice(index, 1)
            }
        }),
        on: vi.fn((type: string, listener: (_event: unknown) => void) => {
            const existing = listeners.get(type) ?? []
            existing.push(listener)
            listeners.set(type, existing)
            return { type, listener }
        }),
        getViewport: vi.fn(() => viewport),
        getView: vi.fn(() => ({
            getResolution: () => 1,
        })),
        getInteractions: vi.fn(() => interactions),
        forEachFeatureAtPixel: vi.fn((_pixel, callback) => {
            if (!hit) {
                return undefined
            }
            return callback(hit.feature, hit.layer)
        }),
        getCoordinateFromPixel: vi.fn((pixel: number[]) => pixel),
        __emit: (type: string, event: unknown) => {
            ;(listeners.get(type) ?? []).forEach((listener) => listener(event))
        },
        __setHit: (nextHit: MapHit | null) => {
            hit = nextHit
        },
        __interactions: interactions,
    }

    return map
}

function mountWithMap(map: MockMap) {
    const Harness = defineComponent({
        setup(_, { expose }) {
            const api = useOlDrawing('drawing-layer', 'uuid-123', 0.8)
            expose({ api })
            return () => h('div')
        },
    })

    const wrapper = mount(Harness, {
        global: {
            provide: {
                olMap: map,
            },
        },
    })

    return {
        wrapper,
        api: (wrapper.vm as unknown as { api: ReturnType<typeof useOlDrawing> }).api,
    }
}

describe('useOlDrawing', () => {
    beforeEach(() => {
        drawingStoreMock.isDrawing = false
        drawingStoreMock.drawingMode = 'None'
        drawingStoreMock.setOlLayer.mockReset()
        drawingStoreMock.setMeasurementSubtype.mockReset()
        drawingStoreMock.updateFeatureAttributes.mockReset()
        drawingStoreMock.ensureFeatureAttributes.mockReset()
    })

    describe('useOlDrawing', () => {
        it('throws when OpenLayers map is not injected', () => {
            const Harness = defineComponent({
                setup() {
                    useOlDrawing('drawing-layer', 'uuid-123', 1)
                    return () => h('div')
                },
            })

            expect(() => mount(Harness)).toThrow('OpenLayersMap is not available')
        })

        it('adds drawing and endpoint-handle layers on mount and removes them on unmount', () => {
            const map = createMapMock()
            const { wrapper } = mountWithMap(map)

            expect(map.addLayer).toHaveBeenCalledTimes(2)
            expect(drawingStoreMock.setOlLayer).toHaveBeenCalledTimes(1)

            wrapper.unmount()
            expect(map.removeLayer).toHaveBeenCalledTimes(2)
        })
    })

    describe('startDrawing', () => {
        it('starts text drawing and applies text defaults on drawend', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)
            const onFeatureAdded = vi.fn()

            api.startDrawing('Text', onFeatureAdded)

            const draw = map.__interactions.find((interaction) => interaction instanceof Draw)
            expect(draw).toBeDefined()

            const textFeature = new Feature(new Point([100, 200])) as Feature<Geometry>
            draw!.dispatchEvent({ type: 'drawend', feature: textFeature } as unknown as BaseEvent)

            expect(textFeature.get('text')).toBe('New Text')
            expect(drawingStoreMock.updateFeatureAttributes).toHaveBeenCalledWith(
                textFeature,
                expect.objectContaining({ kind: 'Text' })
            )
            expect(onFeatureAdded).toHaveBeenCalledWith(textFeature)
        })

        it('starts measurement drawing and resolves path subtype on drawend', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)

            api.startDrawing('Measurement')

            const draw = map.__interactions.find((interaction) => interaction instanceof Draw)
            expect(draw).toBeDefined()

            const measurementFeature = new Feature(
                new LineString([
                    [0, 0],
                    [1000, 0],
                    [2000, 0],
                ])
            ) as Feature<Geometry>

            draw!.dispatchEvent({
                type: 'drawend',
                feature: measurementFeature,
            } as unknown as BaseEvent)

            expect(drawingStoreMock.setMeasurementSubtype).toHaveBeenCalledWith('Path')
            expect(drawingStoreMock.updateFeatureAttributes).toHaveBeenCalledWith(
                measurementFeature,
                expect.objectContaining({
                    kind: 'MeasurementPath',
                    measurementSubtype: 'Path',
                })
            )
        })

        it('uses currently selected icon when drawing points', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)

            api.setSelectedIcon({
                ...defaultMarkerIcon,
                id: 'custom-icon',
            })
            api.startDrawing('Point')

            const draw = map.__interactions.find((interaction) => interaction instanceof Draw)
            expect(draw).toBeDefined()

            const pointFeature = new Feature(new Point([1, 2])) as Feature<Geometry>
            draw!.dispatchEvent({ type: 'drawend', feature: pointFeature } as unknown as BaseEvent)

            expect(drawingStoreMock.updateFeatureAttributes).toHaveBeenCalledWith(
                pointFeature,
                expect.objectContaining({
                    kind: 'Point',
                    style: expect.objectContaining({ iconId: 'custom-icon' }),
                })
            )
        })
    })

    describe('stopDrawing', () => {
        it('removes active draw interaction', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)

            api.startDrawing('Text')
            const draw = map.__interactions.find((interaction) => interaction instanceof Draw)
            expect(draw).toBeDefined()

            api.stopDrawing()
            expect(map.removeInteraction).toHaveBeenCalledWith(draw)
        })
    })

    describe('enableActiveEditing', () => {
        it('enables editing interactions and inserts/deletes vertices via events', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)

            const lineFeature = new Feature(
                new LineString([
                    [0, 0],
                    [20, 0],
                ])
            ) as Feature<Geometry>
            lineFeature.set('__isSelected', true, true)

            api.addFeatures([lineFeature])
            api.enableActiveEditing()

            map.__setHit({ feature: lineFeature, layer: api.layer })
            map.__emit('singleclick', {
                pixel: [5, 0],
                coordinate: [10, 0],
            })

            const coordinatesAfterInsert = (
                lineFeature.getGeometry() as LineString
            ).getCoordinates()
            expect(coordinatesAfterInsert).toHaveLength(3)

            const viewport = map.getViewport()
            viewport.dispatchEvent(
                new MouseEvent('contextmenu', {
                    bubbles: true,
                    cancelable: true,
                    clientX: 10,
                    clientY: 0,
                })
            )

            const coordinatesAfterDelete = (
                lineFeature.getGeometry() as LineString
            ).getCoordinates()
            expect(coordinatesAfterDelete).toHaveLength(2)
        })
    })

    describe('disableActiveEditing', () => {
        it('deactivates editing after it was enabled', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)

            api.enableActiveEditing()
            api.disableActiveEditing()

            expect(map.removeInteraction).toHaveBeenCalled()
        })
    })

    describe('enablePassiveInspection', () => {
        it('notifies selected feature payload and hover hint payload', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)

            const feature = new Feature(new Point([15, 20])) as Feature<Geometry>
            feature.set('kind', 'Point')
            feature.set('title', 'Marker title')
            api.addFeatures([feature])

            const onFeatureSelected = vi.fn()
            const onHoverHintChanged = vi.fn()

            api.enablePassiveInspection(onFeatureSelected, onHoverHintChanged)

            map.__setHit({ feature, layer: api.layer })
            map.__emit('singleclick', {
                pixel: [10, 20],
                coordinate: [15, 20],
            })

            expect(onFeatureSelected).toHaveBeenCalledWith(
                expect.objectContaining({
                    kind: 'Point',
                    title: 'Marker title',
                    geometryType: 'Point',
                })
            )

            map.__emit('pointermove', {
                pixel: [10, 20],
                originalEvent: { clientX: 120, clientY: 300 },
            })

            expect(onHoverHintChanged).toHaveBeenCalledWith(
                expect.objectContaining({
                    x: 134,
                    y: 308,
                })
            )
        })
    })

    describe('disablePassiveInspection', () => {
        it('clears cursor state', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)

            api.enablePassiveInspection()
            api.disablePassiveInspection()

            expect(map.getViewport().style.cursor).toBe('')
        })
    })

    describe('addFeatures', () => {
        it('ensures feature attributes and appends features to source', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)
            const pointFeature = new Feature(new Point([7, 47])) as Feature<Geometry>
            const lineFeature = new Feature(
                new LineString([
                    [0, 0],
                    [10, 0],
                ])
            ) as Feature<Geometry>

            api.addFeatures([pointFeature, lineFeature])

            expect(drawingStoreMock.ensureFeatureAttributes).toHaveBeenCalledTimes(2)
            expect(api.getFeatures()).toHaveLength(2)
        })
    })

    describe('getFeatures', () => {
        it('returns all features currently in source', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)
            const pointFeature = new Feature(new Point([7, 47])) as Feature<Geometry>

            api.addFeatures([pointFeature])

            expect(api.getFeatures()).toEqual([pointFeature])
        })
    })

    describe('clearFeatures', () => {
        it('removes all source features', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)
            const pointFeature = new Feature(new Point([7, 47])) as Feature<Geometry>

            api.addFeatures([pointFeature])
            api.clearFeatures()

            expect(api.getFeatures()).toHaveLength(0)
        })
    })

    describe('setVisibility', () => {
        it('updates drawing layer visibility', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)

            api.setVisibility(false)

            expect(api.layer.getVisible()).toBe(false)
        })
    })

    describe('setZIndex', () => {
        it('updates drawing layer z-index', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)

            api.setZIndex(42)

            expect(api.layer.getZIndex()).toBe(42)
        })
    })

    describe('updateFeatureText', () => {
        it('updates text property on feature', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)
            const pointFeature = new Feature(new Point([7, 47])) as Feature<Geometry>

            api.updateFeatureText(pointFeature, 'Updated Label')

            expect(pointFeature.get('text')).toBe('Updated Label')
        })
    })

    describe('setSelectedIcon', () => {
        it('updates selectedIcon readonly state', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)

            api.setSelectedIcon({
                ...defaultMarkerIcon,
                id: 'custom-icon',
            })

            expect(api.selectedIcon.value.id).toBe('custom-icon')
        })
    })
})
