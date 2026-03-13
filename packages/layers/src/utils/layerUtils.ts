import type { Dataset } from '@swissgeo/ogc'

import log, { LogLevel } from '@swissgeo/log'

import type { Layer, LayerInfo } from '@/index'

// can't be inherited from the main package apparently
log.wantedLevels = [LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error]

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

    // TODO we should validate the dataset here

    return {
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
