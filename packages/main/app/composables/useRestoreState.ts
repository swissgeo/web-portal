import log, { LogPreDefinedColor } from '@swissgeo/log'
import { validateAndPrepareAppStatePayload } from '@swissgeo/statesharing'
import { watchDebounced } from '@vueuse/core'
import { useStateConfig } from '~/composables/useStateConfig'
import { useUrlParams } from '~/composables/useUrlParams'

export const STORAGE_KEY = 'swissgeo_app_state'

/**
 * Restoring a state
 *
 * This function restores a state either from the sessionStorage or
 * the URL parameter.
 */
export function useRestoreState() {
    const toaster = useToaster()
    const { $i18n } = useNuxtApp()

    const { exportState, importState } = useStateConfig()

    // isImporting flag prevents writing back to sessionStorage immediately
    // after we just read from it during hydration.
    const isImporting = ref(false)

    async function restore() {
        log.debug({
            title: 'useRestoreState',
            titleColor: LogPreDefinedColor.Sky,
            messages: ['About to restore state from URL or sessionStorage'],
        })

        const { getStateFromUrl, getZoomFromUrl } = useUrlParams()
        const zoomFromUrl = getZoomFromUrl()
        
        try {
            const stateFromUrlParam = await getStateFromUrl()
             
            log.debug({
                title: 'useRestoreState',
                titleColor: LogPreDefinedColor.Sky,
                messages: ['State from the URL param', stateFromUrlParam],
            })

            // If a valid state ID is preent in URL, it takes precedance over the state in SessionStorage
            if (stateFromUrlParam) {
                const config = validateAndPrepareAppStatePayload(stateFromUrlParam)

                // If a zoom is in URL, it overwrite the zoom from config
                // (used in the print feature)
                if (zoomFromUrl) {
                    config.state.map.zoom = zoomFromUrl
                }
                
                await importState(config)
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(config))
                return
            }
        } catch {
            log.error({
                title: 'useRestoreState',
                titleColor: LogPreDefinedColor.Sky,
                messages: ['State restoration is unsuccessful'],
            })
            toaster.showWarning($i18n.t('state.restoreUnableWarning'))
        }

        // Restore state from sessionStorage on load
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY)
            if (stored) {
                isImporting.value = true
                const config = validateAndPrepareAppStatePayload(JSON.parse(stored))

                // If a zoom is in URL, it overwrite the zoom from config
                // (used in the print feature, added in the localStorage logic for debugging)
                if (zoomFromUrl) {
                    config.state.map.zoom = zoomFromUrl
                }
                
                await importState(config)
                log.info({
                    title: 'useRestoreState',
                    titleColor: LogPreDefinedColor.Sky,
                    messages: ['Restored app state from sessionStorage'],
                })
            }
        } catch (error) {
            log.warn({
                title: 'useRestoreState',
                color: LogPreDefinedColor.Sky,
                messages: [
                    'Failed to restore app state from sessionStorage, clearing stored state',
                    String(error),
                ],
            })
            try {
                sessionStorage.removeItem(STORAGE_KEY)
            } catch {
                // sessionStorage not available, silently ignore
            }
        }
    }

    // Watch for state changes and persist to sessionStorage
    watchDebounced(
        exportState,
        (newState) => {
            if (isImporting.value) {
                isImporting.value = false
                return
            }
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
                log.debug({
                    title: 'useRestoreState',
                    titleColor: LogPreDefinedColor.Sky,
                    messages: ['Storing the current state to the sessionStorage'],
                })
            } catch (error) {
                log.warn({
                    title: 'useRestoreState',
                    titleColor: LogPreDefinedColor.Sky,
                    messages: ['Failed to persist app state to sessionStorage', String(error)],
                })
            }
        },
        { deep: true, debounce: 500, immediate: false }
    )

    function clear() {
        log.info({
            title: 'usRestoreState',
            titleColor: LogPreDefinedColor.Sky,
            messages: ['Clearing the session storage'],
        })
        sessionStorage.clear()
    }

    return {
        restore,
        clear,
    }
}
