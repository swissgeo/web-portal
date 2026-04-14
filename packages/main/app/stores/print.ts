import type { PrintConfig } from '@swissgeo/statesharing'

import { defineStore } from 'pinia'

/**
 * The print store hold the print information.
 */
export const usePrintStore = defineStore('print', () => {
    const printConfig = ref<PrintConfig>()
    const printSizePixel = computed<{width: number, height: number} | null>(() => {
        if (!printConfig.value) {
            return null
        }        
        return getPageSizeInPixels(printConfig.value.format, printConfig.value.orientation, printConfig.value.resolution)
    })

    function readPrintConfigFromUrl(removeFromUrl = false) {
        try {
            const { getPrintConfig } = useUrlParams()
            printConfig.value = getPrintConfig(removeFromUrl)
        } catch { /* empty */ }
    }

    return { printConfig, readPrintConfigFromUrl, printSizePixel }
})
