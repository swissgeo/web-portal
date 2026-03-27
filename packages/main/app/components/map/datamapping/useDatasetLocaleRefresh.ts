import type { DatasetLayer, LayerInfo } from '@swissgeo/layers'
import type { Dataset, Link } from '@swissgeo/ogc'

import { getInfoFromDataset } from '@swissgeo/layers'
import log, { LogPreDefinedColor } from '@swissgeo/log'

/**
 * Helper function that listens to the local change and re-fetches a layer's
 * dataset
 * @param layer
 * @param updateDatasetCallback
 * @param updateLayerInfoCallback
 */
export default function useDatasetLocaleRefresh(
    layer: Pick<DatasetLayer, 'data' | 'uuid' | 'humanId'>,
    updateDatasetCallback: (layerUuid: string, dataset: Dataset) => void,
    updateLayerInfoCallback: (layerUuid: string, info: LayerInfo) => void
) {
    const { locale } = useI18n()

    const newUrlString = computed(() => {
        if (!layer.data.links) {
            throw new Error("dataset doesn't contain self link")
        }
        const datasetLinkObject = layer.data.links.filter((link: Link) => link.rel === 'self')
        if (datasetLinkObject.length === 0) {
            // TODO think about some error handling and toast that into the user's face
            throw new Error("dataset doesn't contain self link")
        }
        if (!datasetLinkObject[0] || !datasetLinkObject[0].href) {
            // TODO think about some error handling and toast that into the user's face
            throw new Error("dataset doesn't contain self link")
        }
        const datasetUrl = new URL(datasetLinkObject[0].href)

        // Change the query param
        datasetUrl.searchParams.set('language', locale.value)

        // Get back a string
        return datasetUrl.toString()
    })

    const { data: dataset } = useFetch<Dataset>(newUrlString)

    watch(dataset, () => {
        if (dataset.value) {
            log.debug({
                title: 'DatasetLayer',
                titleColor: LogPreDefinedColor.Red,
                messages: ['Refreshing the dataset for', layer.humanId],
            })

            updateDatasetCallback(layer.uuid, dataset.value)
            updateLayerInfoCallback(layer.uuid, getInfoFromDataset(dataset.value))
        }
    })

    return {
        // mostly used for testing
        newUrlString,
    }
}
