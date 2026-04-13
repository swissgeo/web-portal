import type { PrintConfig } from '@swissgeo/statesharing'

import { defineStore } from 'pinia'

/**
 * The print store hold the print information. Those are passed at load time
 * via the "app:created" hook (see packages/main/app/plugins/stateConfigSync.client.ts)
 * and importState()
 */
export const usePrintStore = defineStore('print', () => {
    const printConfig = ref<PrintConfig>()

    try {
        const { getPrintConfig } = useUrlParams()
        printConfig.value = getPrintConfig()
    } catch { /* empty */ }

    return { printConfig }
})
