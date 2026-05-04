import type { DatasetLayer, LayerInfo } from '@swissgeo/layers'
import type { Dataset, Link } from '@swissgeo/ogc'
import type { Ref } from 'vue'

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

    const selfLink = layer.data.links?.find((link: Link) => link.rel === 'self')

    const newUrlString = computed((): string | null => {
        if (!selfLink?.href) {
            return null
        }
        const datasetUrl = new URL(selfLink.href)
        datasetUrl.searchParams.set('language', locale.value)
        return datasetUrl.toString()
    })

    if (!selfLink?.href) {
        return { newUrlString }
    }

    const { data: dataset } = useFetch<Dataset>(newUrlString as Ref<string>)

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
