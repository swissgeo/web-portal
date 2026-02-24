import type { Dataset } from '@swissgeo/ogc'

import log, { LogLevel } from '@swissgeo/log'

import type { LayerType, Layer, LayerInfo } from '@/index'

import { useLayerStore } from '@/stores/layer'

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
export const makeServerLayer = (
    type: LayerType,
    dataset: Dataset,
    options?: Partial<Layer>
): Layer => {
    // TO DO GPS-500 : remove zIndex and layer Store

    const layerStore = useLayerStore()
    log.debug(`Creating store layer from ${JSON.stringify(dataset)}`)

    return {
        uuid: crypto.randomUUID(),
        humanId: dataset.id,
        opacity: 1,
        dataset,
        isVisible: true,
        type,
        isLoading: false,
        zIndex: layerStore.greatestZIndex + 1,
        info: getInfoFromDataset(dataset),
        ...options,
    }
}
