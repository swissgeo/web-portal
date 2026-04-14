import type { PrintConfig } from '@swissgeo/statesharing'

import { defineStore } from 'pinia'

/**
 * The print store hold the print information.
 */
export const usePrintStore = defineStore('print', () => {
    const printConfig = ref<PrintConfig>()

    function readPrintConfigFromUrl(removeFromUrl = false) {
        try {
            const { getPrintConfig } = useUrlParams()
            printConfig.value = getPrintConfig(removeFromUrl)
        } catch { /* empty */ }
    }

    return { printConfig, readPrintConfigFromUrl }
})
