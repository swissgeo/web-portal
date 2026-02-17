import type { Dataset } from '@swissgeo/ogc'

import { createTestingPinia } from '@pinia/testing'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useLayerStore } from '@/stores/layer'
import { getInfoFromDataset, makeServerLayer } from '@/utils/layerUtils'
import type { LayerType } from '../../types'

// we need to mock the layer store so we can check the functions work with various z indexes

const pinia = createTestingPinia({
    createSpy: vi.fn,
})
setActivePinia(pinia)
const layerStore = useLayerStore()
const fake_uuid = 'mock-uuid-with-extra-step'

function createExpectedObject(layerType: LayerType, dataset: Dataset) {
    return {
        uuid: fake_uuid,
        humanId: 'dataset-1',
        opacity: 1,
        dataset,
        isVisible: true,
        type: layerType,
        isLoading: false,
        zIndex: 6,
        info: {
            displayName: 'Layer Title',
            attribution: {
                title: 'SwissGeo',
            },
            abstract: 'Layer description',
        },
    }
}
/**
 * we create a fake layers array to have the correct z index returned within our mocked store.
 * TO DO GPS-500 : remove zIndex and layer Store
 * @param nb_layer : number of layers to add
 */
function setZindex(nb_layer: number) {
    const layers: Layer[] = []
    for (let i = 0; i < nb_layer; i++) {
        layers.push({
            type: 'wms',
            opacity: 0.5,
            isLoading: false,
            uuid: '',
            humanId: 'fake layer',
            zIndex: 0,
            isVisible: false,
        })
    }
    layerStore.layers = layers
    // the goal is to alter the layers variable in the store to change the zIndex.
}

describe('Testing the information gathering from datasets', () => {
    it('returns dataset.id when properties are undefined', () => {
        const dataset: Dataset = {
            id: 'dataset-1',
            properties: undefined,
        }

        const result = getInfoFromDataset(dataset)

        expect(result).toEqual({
            displayName: 'dataset-1',
        })
    })

    it('returns dataset.id when title is missing', () => {
        const dataset: Dataset = {
            id: 'dataset-2',
            // @ts-expect-error we are willingly sending a faulty dataset here to test
            // the safety feature.
            properties: {},
        }

        const result = getInfoFromDataset(dataset)

        expect(result).toEqual({
            displayName: 'dataset-2',
        })
    })

    it('returns displayName from properties.title', () => {
        const dataset: Dataset = {
            id: 'dataset-3',
            properties: {
                title: 'Layer Title',
                type: 'Dataset',
            },
        }

        const result = getInfoFromDataset(dataset)

        expect(result).toEqual({
            displayName: 'Layer Title',
            abstract: undefined,
        })
    })

    it('includes attribution when provided', () => {
        const dataset: Dataset = {
            id: 'dataset-4',
            properties: {
                title: 'Layer Title',
                attribution: 'SwissGeo',
                type: 'Dataset',
            },
        }

        const result = getInfoFromDataset(dataset)

        expect(result).toEqual({
            displayName: 'Layer Title',
            attribution: {
                title: 'SwissGeo',
            },
            abstract: undefined,
        })
    })

    it('includes abstract when description is provided', () => {
        const dataset: Dataset = {
            id: 'dataset-5',
            properties: {
                title: 'Layer Title',
                description: 'Layer description',
                type: 'Dataset',
            },
        }

        const result = getInfoFromDataset(dataset)

        expect(result).toEqual({
            displayName: 'Layer Title',
            abstract: 'Layer description',
        })
    })

    it('includes displayName, attribution and abstract together', () => {
        const dataset: Dataset = {
            id: 'dataset-6',
            properties: {
                title: 'Layer Title',
                attribution: 'SwissGeo',
                description: 'Layer description',
                type: 'Dataset',
            },
        }

        const result = getInfoFromDataset(dataset)

        expect(result).toEqual({
            displayName: 'Layer Title',
            attribution: {
                title: 'SwissGeo',
            },
            abstract: 'Layer description',
        })
    })
})

describe('testing the makeServerLayer function', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(fake_uuid)
    })

    const baseDataset: Dataset = {
        id: 'dataset-1',
        properties: {
            title: 'Layer Title',
            attribution: 'SwissGeo',
            description: 'Layer description',
            type: 'Dataset',
        },
    }

    // I would've like to add a "non valid type" but the function assume we get
    // a correct type, and thus has no protection.
    it.each`
        layerType    | expectedServerLayerCreated
        ${'wms'}     | ${createExpectedObject('wms', baseDataset)}
        ${'wmts'}    | ${createExpectedObject('wmts', baseDataset)}
        ${'geojson'} | ${createExpectedObject('geojson', baseDataset)}
        ${'vector'}  | ${createExpectedObject('vector', baseDataset)}
        ${'kml'}     | ${createExpectedObject('kml', baseDataset)}
        ${'kmz'}     | ${createExpectedObject('kmz', baseDataset)}
        ${'gpx'}     | ${createExpectedObject('gpx', baseDataset)}
    `(
        'creates a layer with the correct defaults, of the correct type for the layer type : $layerType',
        ({ layerType, expectedServerLayerCreated }) => {
            // TO DO GPS-500 : remove zIndex and layer Store

            setZindex(5)
            const layer = makeServerLayer(layerType, baseDataset)
            expect(layer).toMatchObject(expectedServerLayerCreated)
        }
    )
    // TO DO GPS-500 : remove zIndex and layer Store
    it('overrides defaults with options', () => {
        const layer = makeServerLayer('wms', baseDataset, {
            opacity: 0.3,
            isVisible: false,
            zIndex: 999,
        })

        expect(layer.opacity).toBe(0.3)
        expect(layer.isVisible).toBe(false)
        expect(layer.zIndex).toBe(999)
    })
})
