import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDatasetViewStore = defineStore('datasetView', () => {
    const isOpen = ref(false)
    const activeDatasetId = ref<string | null>(null)

    function openDatasetView(datasetId: string) {
        activeDatasetId.value = datasetId
        isOpen.value = true
    }

    function closeDatasetView() {
        isOpen.value = false
        activeDatasetId.value = null
    }

    return {
        isOpen,
        activeDatasetId,
        openDatasetView,
        closeDatasetView,
    }
})
