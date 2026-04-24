import type { Layer } from '@swissgeo/layers'
import type BaseEvent from 'ol/events/Event'
import type Feature from 'ol/Feature'
import type { Geometry } from 'ol/geom'
import type VectorLayer from 'ol/layer/Vector'
import type * as OlObservable from 'ol/Observable'

import { flushPromises, mount } from '@vue/test-utils'
import OlFeature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import Point from 'ol/geom/Point'
import Draw from 'ol/interaction/Draw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'

import { useOlDrawing } from '../composables/olDrawing.composable'

const { drawingStoreMock, defaultMarkerIcon } = vi.hoisted(() => ({
    drawingStoreMock: {
        isDrawing: false,
        drawingMode: 'None',
        featureCount: 0,
        selectedIconId: undefined as string | undefined,
        drawingFeatures: [] as Feature<Geometry>[],
        setOlLayer: vi.fn(),
        setMeasurementSubtype: vi.fn(),
        updateFeatureAttributes: vi.fn(),
        ensureFeatureAttributes: vi.fn(),
        setDrawingMode: vi.fn(),
        setDrawingName: vi.fn(),
        setSelectedFeatureId: vi.fn(),
        setSelectedFeatureInfo: vi.fn(),
        clearPassiveSelection: vi.fn(),
        extractDrawingNameFromKML: vi.fn(() => null),
        setDrawingFeatures: vi.fn((features: Feature<Geometry>[]) => {
            drawingStoreMock.drawingFeatures = features
        }),
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
        Red: 'Red',
    },
}))

vi.mock('@swissgeo/shared', () => ({
    bearingBetweenCoordinates: vi.fn(() => null),
    DEFAULT_MEASUREMENT_INTERVAL_KILOMETERS: 5,
    DEFAULT_MEASUREMENT_PATH_INTERVAL_KILOMETERS: 10,
    EPSG_2056_CH1903: 'EPSG:2056',
    EPSG_4326_WGS84: 'EPSG:4326',
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
        getView: vi.fn(() => ({ getResolution: () => 1 })),
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

function createLayerFixture(overrides?: Partial<Layer>): Layer {
    return {
        humanId: 'drawing-layer',
        uuid: 'uuid-123',
        opacity: 0.8,
        isVisible: true,
        isLoading: false,
        zIndex: 5,
        type: 'dataset',
        ...overrides,
    } as unknown as Layer
}

function mountWithMap(map: MockMap, layerOverrides?: Partial<Layer>) {
    const layerRef = ref<Layer>(createLayerFixture(layerOverrides))

    const Harness = defineComponent({
        setup(_, { expose }) {
            const api = useOlDrawing(layerRef, ref(map) as never)
            expose({ api, layerRef })
            return () => h('div')
        },
    })

    const wrapper = mount(Harness)

    return {
        wrapper,
        layerRef,
        api: (wrapper.vm as unknown as { api: ReturnType<typeof useOlDrawing> }).api,
    }
}

// Returns the OL VectorLayer registered via drawingStore.setOlLayer
function getOlDrawingLayer(map: MockMap): VectorLayer {
    void map
    return drawingStoreMock.setOlLayer.mock.calls[0]?.[0] as VectorLayer
}

describe('useOlDrawing', () => {
    beforeEach(() => {
        drawingStoreMock.isDrawing = false
        drawingStoreMock.drawingMode = 'None'
        drawingStoreMock.featureCount = 0
        drawingStoreMock.selectedIconId = undefined
        drawingStoreMock.drawingFeatures = []
        drawingStoreMock.setOlLayer.mockReset()
        drawingStoreMock.setMeasurementSubtype.mockReset()
        drawingStoreMock.updateFeatureAttributes.mockReset()
        drawingStoreMock.ensureFeatureAttributes.mockReset()
        drawingStoreMock.setDrawingMode.mockReset()
        drawingStoreMock.setDrawingName.mockReset()
        drawingStoreMock.setSelectedFeatureId.mockReset()
        drawingStoreMock.setSelectedFeatureInfo.mockReset()
        drawingStoreMock.clearPassiveSelection.mockReset()
        drawingStoreMock.extractDrawingNameFromKML.mockReset()
        drawingStoreMock.extractDrawingNameFromKML.mockReturnValue(null)
        drawingStoreMock.setDrawingFeatures.mockReset()
        drawingStoreMock.setDrawingFeatures.mockImplementation((features: Feature<Geometry>[]) => {
            drawingStoreMock.drawingFeatures = features
        })
    })

    describe('initialization', () => {
        it('throws when OpenLayers map is not provided', () => {
            const Harness = defineComponent({
                setup() {
                    const layerRef = ref<Layer>(createLayerFixture())
                    useOlDrawing(layerRef, undefined)
                    return () => h('div')
                },
            })

            expect(() => mount(Harness)).toThrow('OpenLayersMap is not available')
        })

        it('throws when map ref value is undefined', () => {
            const Harness = defineComponent({
                setup() {
                    const layerRef = ref<Layer>(createLayerFixture())
                    useOlDrawing(layerRef, ref(undefined))
                    return () => h('div')
                },
            })

            expect(() => mount(Harness)).toThrow('OpenLayersMap is not available')
        })

        it('adds both drawing layer and endpoint-handle layer on mount', () => {
            const map = createMapMock()
            const { wrapper } = mountWithMap(map)

            expect(map.addLayer).toHaveBeenCalledTimes(2)
            expect(drawingStoreMock.setOlLayer).toHaveBeenCalledTimes(1)

            wrapper.unmount()
            expect(map.removeLayer).toHaveBeenCalledTimes(2)
        })

        it('returns hover hint reactive state', () => {
            const map = createMapMock()
            const { api } = mountWithMap(map)

            expect(api.showHoverHint.value).toBe(false)
            expect(api.hoverHintText.value).toBe('')
            expect(api.hoverHintX.value).toBe(0)
            expect(api.hoverHintY.value).toBe(0)
        })
    })

    describe('layer reactivity', () => {
        it('applies zIndex changes reactively via the layer ref', async () => {
            const map = createMapMock()
            const { layerRef, wrapper } = mountWithMap(map)

            const drawingLayer = map.addLayer.mock.calls[0]?.[0] as {
                getZIndex: () => number
            }

            layerRef.value = { ...layerRef.value, zIndex: 42 }
            await wrapper.vm.$nextTick()

            expect(drawingLayer?.getZIndex()).toBe(42)
        })

        it('applies visibility changes reactively via the layer ref', async () => {
            const map = createMapMock()
            const { layerRef, wrapper } = mountWithMap(map)

            const drawingLayer = map.addLayer.mock.calls[0]?.[0] as {
                getVisible: () => boolean
            }

            layerRef.value = { ...layerRef.value, isVisible: false }
            await wrapper.vm.$nextTick()

            expect(drawingLayer?.getVisible()).toBe(false)
        })

        it('applies opacity changes reactively via the layer ref', async () => {
            const map = createMapMock()
            const { layerRef, wrapper } = mountWithMap(map)

            const drawingLayer = map.addLayer.mock.calls[0]?.[0] as {
                getOpacity: () => number
            }

            layerRef.value = { ...layerRef.value, opacity: 0.5 }
            await wrapper.vm.$nextTick()

            expect(drawingLayer?.getOpacity()).toBe(0.5)
        })
    })

    describe('startDrawing (triggered via drawingMode store state)', () => {
        it('starts text drawing and applies text defaults on drawend', async () => {
            drawingStoreMock.isDrawing = true
            drawingStoreMock.drawingMode = 'Text'
            const map = createMapMock()
            mountWithMap(map)
            await flushPromises()

            const draw = map.__interactions.find((i) => i instanceof Draw)
            expect(draw).toBeDefined()

            const textFeature = new OlFeature(new Point([100, 200])) as Feature<Geometry>
            draw!.dispatchEvent({
                type: 'drawend',
                feature: textFeature,
            } as unknown as BaseEvent)

            expect(textFeature.get('text')).toBe('New Text')
            expect(drawingStoreMock.updateFeatureAttributes).toHaveBeenCalledWith(
                textFeature,
                expect.objectContaining({ kind: 'Text' })
            )
            // drawend callback resets the mode to 'None'
            expect(drawingStoreMock.setDrawingMode).toHaveBeenCalledWith('None')
        })

        it('starts measurement drawing and resolves path subtype on drawend', async () => {
            drawingStoreMock.isDrawing = true
            drawingStoreMock.drawingMode = 'Measurement'
            const map = createMapMock()
            mountWithMap(map)
            await flushPromises()

            const draw = map.__interactions.find((i) => i instanceof Draw)
            expect(draw).toBeDefined()

            const measurementFeature = new OlFeature(
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

        it('applies the default icon when drawing a point feature', async () => {
            drawingStoreMock.isDrawing = true
            drawingStoreMock.drawingMode = 'Point'
            const map = createMapMock()
            mountWithMap(map)
            await flushPromises()

            const draw = map.__interactions.find((i) => i instanceof Draw)
            expect(draw).toBeDefined()

            const pointFeature = new OlFeature(new Point([1, 2])) as Feature<Geometry>
            draw!.dispatchEvent({
                type: 'drawend',
                feature: pointFeature,
            } as unknown as BaseEvent)

            expect(drawingStoreMock.updateFeatureAttributes).toHaveBeenCalledWith(
                pointFeature,
                expect.objectContaining({
                    kind: 'Point',
                    style: expect.objectContaining({ iconId: defaultMarkerIcon.id }),
                })
            )
        })

        it('removes the Draw interaction on unmount while drawing', async () => {
            drawingStoreMock.isDrawing = true
            drawingStoreMock.drawingMode = 'Text'
            const map = createMapMock()
            const { wrapper } = mountWithMap(map)
            await flushPromises()

            const draw = map.__interactions.find((i) => i instanceof Draw)
            expect(draw).toBeDefined()

            wrapper.unmount()

            expect(map.removeInteraction).toHaveBeenCalledWith(draw)
        })
    })

    describe('passive inspection (default mode: isDrawing=false)', () => {
        it('notifies store on feature click and updates hover hint on pointermove', async () => {
            const feature = new OlFeature(new Point([15, 20])) as Feature<Geometry>
            feature.set('kind', 'Point')
            feature.set('title', 'Marker title')
            drawingStoreMock.drawingFeatures = [feature]

            const map = createMapMock()
            const { api } = mountWithMap(map)
            await flushPromises()

            const olLayer = getOlDrawingLayer(map)
            map.__setHit({ feature, layer: olLayer })

            map.__emit('singleclick', { pixel: [10, 20], coordinate: [15, 20] })

            expect(drawingStoreMock.setSelectedFeatureId).toHaveBeenCalled()
            expect(drawingStoreMock.setSelectedFeatureInfo).toHaveBeenCalledWith(
                expect.objectContaining({ kind: 'Point', title: 'Marker title' })
            )

            map.__emit('pointermove', {
                pixel: [10, 20],
                originalEvent: { clientX: 120, clientY: 300 },
            })

            expect(api.showHoverHint.value).toBe(true)
            expect(api.hoverHintText.value).toContain('select')
        })

        it('clears cursor style when pointer leaves the viewport', async () => {
            const map = createMapMock()
            mountWithMap(map)
            await flushPromises()

            const viewport = map.getViewport()
            viewport.dispatchEvent(new PointerEvent('pointerleave'))

            expect(viewport.style.cursor).toBe('')
        })
    })

    describe('active editing (default mode: isDrawing=false)', () => {
        it('inserts a vertex on singleclick when a line feature is selected', async () => {
            const lineFeature = new OlFeature(
                new LineString([
                    [0, 0],
                    [20, 0],
                ])
            ) as Feature<Geometry>
            lineFeature.set('__isSelected', true, true)
            drawingStoreMock.drawingFeatures = [lineFeature]

            const map = createMapMock()
            mountWithMap(map)
            await flushPromises()

            const olLayer = getOlDrawingLayer(map)
            map.__setHit({ feature: lineFeature, layer: olLayer })

            map.__emit('singleclick', { pixel: [5, 0], coordinate: [10, 0] })

            const coordinates = (lineFeature.getGeometry() as LineString).getCoordinates()
            expect(coordinates).toHaveLength(3)
        })

        it('deletes a vertex on contextmenu when a line feature is selected', async () => {
            const lineFeature = new OlFeature(
                new LineString([
                    [0, 0],
                    [10, 0],
                    [20, 0],
                ])
            ) as Feature<Geometry>
            lineFeature.set('__isSelected', true, true)
            drawingStoreMock.drawingFeatures = [lineFeature]

            const map = createMapMock()
            mountWithMap(map)
            await flushPromises()

            const olLayer = getOlDrawingLayer(map)
            map.__setHit({ feature: lineFeature, layer: olLayer })

            map.getViewport().dispatchEvent(
                new MouseEvent('contextmenu', {
                    bubbles: true,
                    cancelable: true,
                    clientX: 10,
                    clientY: 0,
                })
            )

            const coordinates = (lineFeature.getGeometry() as LineString).getCoordinates()
            expect(coordinates).toHaveLength(2)
        })
    })

    describe('restoreFeatures (called on mount)', () => {
        it('restores features from drawingFeatures store on mount', () => {
            const feature = new OlFeature(new Point([1, 2])) as Feature<Geometry>
            drawingStoreMock.drawingFeatures = [feature]

            const map = createMapMock()
            mountWithMap(map)

            expect(drawingStoreMock.ensureFeatureAttributes).toHaveBeenCalledWith(feature)
        })

        it('sets drawing name from layer info on mount', () => {
            const map = createMapMock()
            mountWithMap(map, { info: { displayName: 'My Drawing' } })

            expect(drawingStoreMock.setDrawingName).toHaveBeenCalledWith('My Drawing')
        })
    })
})
