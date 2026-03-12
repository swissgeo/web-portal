import type { DatasetCollection } from '@swissgeo/ogc'
import type { Ref } from 'vue'

import { storeToRefs } from 'pinia'

import { useOgcDatasetCollectionStore } from '@/stores/ogcDatasetCollection'

type UseOgcDatasetCollectionOptions = {
    initializeOnUse?: boolean
}

export async function useOgcDatasetCollection(options: UseOgcDatasetCollectionOptions = {}) {
    const { initializeOnUse = true } = options
    const { locale } = useI18n()
    const ogcDatasetCollectionStore = useOgcDatasetCollectionStore()

    ogcDatasetCollectionStore.startLocaleSync(locale)
    if (initializeOnUse) {
        await ogcDatasetCollectionStore.initialize(locale.value)
    }

    const { data, pending, error } = storeToRefs(ogcDatasetCollectionStore)

    return {
        data,
        pending,
        error,
    } as {
        data: Ref<DatasetCollection | null>
        pending: Ref<boolean>
        error: Ref<unknown>
    }
}
