import type { Dataset } from '@swissgeo/ogc'

import log from '@swissgeo/log'

import type { DatasetLayer, Layer, LayerInfo } from '@/index'

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

    // extract the self link from the dataset
    const layerUrl = (() => {
        const selfLink = dataset.links?.filter((link) => link.rel === 'self').pop()

        if (!selfLink?.href) {
            throw new Error("The dataset doesn't contain a link to itself. We cannot use this")
        }
        return selfLink.href
    })()

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
