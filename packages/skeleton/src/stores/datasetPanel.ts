import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDatasetPanelStore = defineStore('datasetPanel', () => {
    const isOpen = ref(false)
    const activeDatasetId = ref<string | null>(null)

    function openDatasetPanel(datasetId: string) {
        activeDatasetId.value = datasetId
        isOpen.value = true
    }

    function closeDatasetPanel() {
        isOpen.value = false
        activeDatasetId.value = null
    }

    return {
        isOpen,
        activeDatasetId,
        openDatasetPanel,
        closeDatasetPanel,
    }
})
