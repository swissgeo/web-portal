import type { Dataset } from '@swissgeo/ogc'

import log from '@swissgeo/log'

import type { DatasetLayer, Layer, LayerInfo } from '@/index'

export class InvalidDatasetError extends Error {
    constructor(reason: string) {
        super(`Invalid dataset: ${reason}`)
        this.name = 'InvalidDatasetError'
    }
}

const isNonEmptyString = (value: unknown): value is string => {
    return typeof value === 'string' && value.length > 0
}

/**
 * Structural validation of a Dataset, used before creating a layer from it.
 *
 * The Dataset type is produced by the backend OGC API, but the data can also
 * come from user-controlled sources (state sharing URLs, sessionStorage,
 * external fetches). This guards against passing something else (error
 * payloads, malformed JSON, stale/misshaped data) down the layer pipeline.
 */
export const validateDataset: (value: unknown) => asserts value is Dataset = (value) => {
    if (value === null || typeof value !== 'object') {
        throw new InvalidDatasetError('value is not an object')
    }

    const candidate = value as Partial<Dataset>

    if (!isNonEmptyString(candidate.id)) {
        throw new InvalidDatasetError('missing or empty "id"')
    }

    if (!candidate.properties || typeof candidate.properties !== 'object') {
        throw new InvalidDatasetError('missing "properties"')
    }

    if (candidate.properties.type !== 'Dataset') {
        throw new InvalidDatasetError(
            `"properties.type" must be "Dataset" (got ${JSON.stringify(candidate.properties.type)})`
        )
    }

    if (!isNonEmptyString(candidate.properties.title)) {
        throw new InvalidDatasetError('missing or empty "properties.title"')
    }

    if (candidate.links !== undefined && !Array.isArray(candidate.links)) {
        throw new InvalidDatasetError('"links" must be an array when present')
    }

    const selfLink = candidate.links?.find((link) => link.rel === 'self')
    if (!selfLink?.href) {
        throw new InvalidDatasetError('no "self" link with href')
    }
}

// only exported for testing purpose.
export const getInfoFromDataset = (dataset: Dataset): LayerInfo => {
    const properties = dataset.properties
    const displayName = properties?.title

    if (!properties || !displayName) {
        return {
            displayName: dataset.id,
        }
    }

    const attributionName = properties.attribution

    let attribution
    if (attributionName) {
        attribution = {
            title: attributionName,
        }
    }

    const abstract = properties.description

    return {
        // only add those if they're not undefined
        ...{ displayName },
        ...{ attribution },
        abstract,
        // TODO also do contacts
    }
}

// Server layer fills properties like the Dataset
export const makeServerLayer = (dataset: Dataset, options?: Partial<Layer>): Layer => {
    log.debug(`Creating store layer from ${JSON.stringify(dataset)}`)

    validateDataset(dataset)

    // extract the self link from the dataset (validated above)
    const layerUrl = dataset.links!.find((link) => link.rel === 'self')!.href

    return {
        layerUrl,
        type: 'dataset',
        uuid: crypto.randomUUID(),
        humanId: dataset.id,
        opacity: 1,
        data: dataset,
        isVisible: true,
        isLoading: false,
        info: getInfoFromDataset(dataset),
        ...options,
    }
}

export const isDatasetLayer = (layer: Layer): layer is DatasetLayer => {
    return layer.type === 'dataset'
}
