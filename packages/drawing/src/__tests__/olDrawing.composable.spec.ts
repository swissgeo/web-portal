import type { Layer } from '@swissgeo/layers'
import type Feature from 'ol/Feature'
import type { Geometry } from 'ol/geom'
import type * as OlObservable from 'ol/Observable'

import { mount } from '@vue/test-utils'
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
    __interactions: unknown[]
}

function createMapMock(): MockMap {
    const viewport = document.createElement('div')
    document.body.appendChild(viewport)

    const interactions: unknown[] = []

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
        on: vi.fn(() => ({ type: '', listener: vi.fn() })),
        getViewport: vi.fn(() => viewport),
        getView: vi.fn(() => ({
            getResolution: () => 1,
        })),
        getInteractions: vi.fn(() => interactions),
        forEachFeatureAtPixel: vi.fn(() => undefined),
        getCoordinateFromPixel: vi.fn((pixel: number[]) => pixel),
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
        type: 'dataset',
        ...overrides,
    } as unknown as Layer
}

function mountWithMap(map: MockMap, layerOverrides?: Partial<Layer>) {
    const layerRef = ref<Layer>(createLayerFixture(layerOverrides))
    const zIndexRef = ref(5)

    const Harness = defineComponent({
        setup(_, { expose }) {
            const api = useOlDrawing(layerRef, zIndexRef, ref(map) as never)
            expose({ api, layerRef, zIndexRef })
            return () => h('div')
        },
    })

    const wrapper = mount(Harness)

    return {
        wrapper,
        layerRef,
        zIndexRef,
        api: (wrapper.vm as unknown as { api: ReturnType<typeof useOlDrawing> }).api,
    }
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
    })

    describe('initialization', () => {
        it('throws when OpenLayers map is not provided', () => {
            const Harness = defineComponent({
                setup() {
                    const layerRef = ref<Layer>(createLayerFixture())
                    useOlDrawing(layerRef, ref(0), undefined)
                    return () => h('div')
                },
            })

            expect(() => mount(Harness)).toThrow('OpenLayersMap is not available')
        })

        it('throws when map ref value is undefined', () => {
            const Harness = defineComponent({
                setup() {
                    const layerRef = ref<Layer>(createLayerFixture())
                    useOlDrawing(layerRef, ref(0), ref(undefined))
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
        it('applies zIndex changes reactively via the zIndex ref', async () => {
            const map = createMapMock()
            const { zIndexRef, wrapper } = mountWithMap(map)

            const drawingLayer = map.addLayer.mock.calls[0]?.[0] as {
                getZIndex: () => number
            }

            zIndexRef.value = 42
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

    describe('drawing interactions via store state', () => {
        it('adds a Draw interaction to the map when drawingMode is set to Point', async () => {
            drawingStoreMock.isDrawing = true
            drawingStoreMock.drawingMode = 'Point'
            const map = createMapMock()
            const { wrapper } = mountWithMap(map)

            await wrapper.vm.$nextTick()
            await wrapper.vm.$nextTick()

            const draw = map.__interactions.find((i) => i instanceof Draw)
            expect(draw).toBeDefined()
        })
    })
})
