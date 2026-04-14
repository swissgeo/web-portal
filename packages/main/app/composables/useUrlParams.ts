import type { PrintConfig } from '@swissgeo/statesharing';

import log, { LogPreDefinedColor } from '@swissgeo/log'
import {  validatePrintConfig } from '@swissgeo/statesharing'
import { fetchStateFromStateId } from '~/utils/fetchStateFromStateId'


// URL param providing the ID to a state (map config such a center, resolution, print info, etc.)
const URL_PARAM_STATE = 'state'

// URL param related to print config
const URL_PARAM_PRINT_FORMAT = 'print_format'
const URL_PARAM_PRINT_ORIENTATION = 'print_orientation'
const URL_PARAM_PRINT_RESOLUTION = 'print_resolution'
const URL_PARAM_PRINT_SCALE = 'print_scale'

export function useUrlParams() {
    const route = useRoute()
    const router = useRouter()
    
    /**
     * Read the state ID from URL param, load the state corresponding to this ID,
     * return it as a payload and removed the param from the URL
     */
    function extractStateId(): string | null {
        const stateParam = route.query[URL_PARAM_STATE]

        if (!stateParam) {
            return null
        }

        // Extract the value, handling the case where multiple params with the same name exist
        const stateId = Array.isArray(stateParam) ? stateParam[0] : stateParam

        // remove the state ID from the URL (without page refresh)
        onNuxtReady(async () => {
            const newQuery = { ...route.query }
            delete newQuery[URL_PARAM_STATE]
            await router.replace({ query: newQuery })
        })

        if (typeof stateId !== 'string') {
            return null
        }

        log.debug({
            title: 'useUrlParam',
            titleColor: LogPreDefinedColor.Sky,
            messages: [
                'State found in the URL param, using this to fetch the state from the service',
                stateId,
            ],
        })

        return stateId
    }

    /**
     * Read the state ID from URL param, load the state corresponding to this ID,
     * return it as a payload and removed the param from the URL
     */
    function getStateFromUrl(): Promise<unknown> {
        const stateId = extractStateId()
        if (!stateId) {
            return Promise.resolve(null)
        }
        return fetchStateFromStateId(stateId)
    }

    /**
     * Get the print config from the URL
     * ?print_format=a4&print_orientation=landscape&print_scale=25000&print_resolution=96
     */
    function getPrintConfig(removeFromUrl = false): PrintConfig {
        const printConfig = {
            format: route.query[URL_PARAM_PRINT_FORMAT],
            orientation: route.query[URL_PARAM_PRINT_ORIENTATION],
            resolution: parseFloat(route.query[URL_PARAM_PRINT_RESOLUTION] as string),
            scale: parseFloat(route.query[URL_PARAM_PRINT_SCALE] as string),
        }

        if (removeFromUrl) {
            // remove the print config from the URL (without page refresh)
            onNuxtReady(async () => {
                const newQuery = { ...route.query }
                delete newQuery[URL_PARAM_PRINT_FORMAT]
                delete newQuery[URL_PARAM_PRINT_ORIENTATION]
                delete newQuery[URL_PARAM_PRINT_RESOLUTION]
                delete newQuery[URL_PARAM_PRINT_SCALE]
                await router.replace({ query: newQuery })
            })
        }
        
        validatePrintConfig(printConfig);
        return printConfig
    }

    return {
        getStateFromUrl,
        extractStateId,
        getPrintConfig,
    }
}
