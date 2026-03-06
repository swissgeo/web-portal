import type { Dataset } from '@swissgeo/ogc'

import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { LayerType } from '@/types'

import { getInfoFromDataset, makeServerLayer } from '@/utils/layerUtils'

function createExpectedObject(layerType: LayerType, dataset: Dataset) {
    return {
        uuid: 'mock-uuid-with-extra-step',
        humanId: 'dataset-1',
        opacity: 1,
        dataset,
        isVisible: true,
        type: layerType,
        isLoading: false,
        info: {
            displayName: 'Layer Title',
            attribution: {
                title: 'SwissGeo',
            },
            abstract: 'Layer description',
        },
    }
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

        vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('mock-uuid-with-extra-step')
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
            const layer = makeServerLayer(layerType, baseDataset)
            expect(layer).toMatchObject(expectedServerLayerCreated)
        }
    )

    it('overrides defaults with options', () => {
        const layer = makeServerLayer('wms', baseDataset, {
            opacity: 0.3,
            isVisible: false,
        })

        expect(layer.opacity).toBe(0.3)
        expect(layer.isVisible).toBe(false)
    })
})
