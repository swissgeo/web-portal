import type { Dataset } from '@swissgeo/ogc'

import { omit } from 'lodash'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
    getInfoFromDataset,
    InvalidDatasetError,
    makeServerLayer,
    validateDataset,
} from '@/utils/layerUtils'

describe('Testing the information gathering from datasets', () => {
    it('returns dataset.id when properties are undefined', () => {
        // @ts-expect-error Intentionally not defining properties
        const dataset: Dataset = {
            id: 'dataset-1',
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

    it('prioritizes first contact organisation over attribution', () => {
        const dataset: Dataset = {
            id: 'dataset-contacts-priority',
            properties: {
                title: 'Layer Title',
                attribution: 'SwissGeo',
                contacts: [
                    {
                        country: 'CH',
                        role: 'pointOfContact',
                        organisation: 'Federal Office of Topography',
                    },
                ],
                type: 'Dataset',
            },
        }

        const result = getInfoFromDataset(dataset)

        expect(result).toEqual({
            displayName: 'Layer Title',
            attribution: {
                title: 'Federal Office of Topography',
            },
            abstract: undefined,
        })
    })

    it('falls back to properties.attribution when first contact organisation is blank', () => {
        const dataset: Dataset = {
            id: 'dataset-contact-blank',
            properties: {
                title: 'Layer Title',
                attribution: 'SwissGeo fallback',
                contacts: [
                    {
                        country: 'CH',
                        role: 'pointOfContact',
                        organisation: '   ',
                    },
                ],
                type: 'Dataset',
            },
        }

        const result = getInfoFromDataset(dataset)

        expect(result).toEqual({
            displayName: 'Layer Title',
            attribution: {
                title: 'SwissGeo fallback',
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
        links: [
            {
                rel: 'self',
                href: 'link-to-self',
            },
        ],
    }

    // I would've like to add a "non valid type" but the function assume we get
    // a correct type, and thus has no protection.
    it('creates a layer with the correct defaults', () => {
        const layer = makeServerLayer(baseDataset)
        expect(layer.isLoading).toEqual(false)
    })

    it('overrides defaults with options', () => {
        const layer = makeServerLayer(baseDataset, {
            isLoading: true,
        })

        expect(layer.isLoading).toBe(true)
    })

    it('extracts the layerURL from the dataset correctly', () => {
        const layer = makeServerLayer(baseDataset)
        expect(layer.layerUrl).toEqual('link-to-self')
    })

    it('throws an error when there are no links in the dataset', () => {
        const faultyDataset = omit(baseDataset, ['links'])
        expect(() => makeServerLayer(faultyDataset)).toThrow(InvalidDatasetError)
    })

    it('throws an error when there is no self-links in the dataset', () => {
        const faultyDataset = {
            ...baseDataset,
            links: [
                {
                    rel: 'distributions',
                    href: 'link',
                },
            ],
        }
        expect(() => makeServerLayer(faultyDataset)).toThrow(InvalidDatasetError)
    })
})

describe('validateDataset', () => {
    const validDataset: Dataset = {
        id: 'dataset-1',
        properties: {
            title: 'Layer Title',
            type: 'Dataset',
        },
        links: [
            {
                rel: 'self',
                href: 'link-to-self',
            },
        ],
    }

    it('accepts a well-formed dataset', () => {
        expect(() => validateDataset(validDataset)).not.toThrow()
    })

    it('rejects null', () => {
        expect(() => validateDataset(null)).toThrow(InvalidDatasetError)
    })

    it('rejects undefined', () => {
        expect(() => validateDataset(undefined)).toThrow(InvalidDatasetError)
    })

    it('rejects a string', () => {
        expect(() => validateDataset('not a dataset')).toThrow(InvalidDatasetError)
    })

    it('rejects a dataset with a missing id', () => {
        const faulty = omit(validDataset, ['id'])
        expect(() => validateDataset(faulty)).toThrow(/id/)
    })

    it('rejects a dataset with an empty id', () => {
        expect(() => validateDataset({ ...validDataset, id: '' })).toThrow(/id/)
    })

    it('rejects a dataset with missing properties', () => {
        const faulty = omit(validDataset, ['properties'])
        expect(() => validateDataset(faulty)).toThrow(/properties/)
    })

    it('rejects a dataset whose properties.type is not "Dataset"', () => {
        const faulty = {
            ...validDataset,
            properties: { ...validDataset.properties, type: 'Distribution' },
        }
        expect(() => validateDataset(faulty)).toThrow(/Dataset/)
    })

    it('rejects a dataset with an empty properties.title', () => {
        const faulty = {
            ...validDataset,
            properties: { ...validDataset.properties, title: '' },
        }
        expect(() => validateDataset(faulty)).toThrow(/title/)
    })

    it('rejects a dataset whose links is not an array', () => {
        const faulty = { ...validDataset, links: 'not-an-array' }
        expect(() => validateDataset(faulty)).toThrow(/links/)
    })

    it('rejects a dataset without a self link', () => {
        const faulty = {
            ...validDataset,
            links: [{ rel: 'distributions', href: 'link' }],
        }
        expect(() => validateDataset(faulty)).toThrow(/self/)
    })
})
