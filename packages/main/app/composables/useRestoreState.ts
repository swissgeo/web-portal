import log from '@swissgeo/log'
import { validateAndPrepareAppStatePayload } from '@swissgeo/statesharing'
import { watchDebounced } from '@vueuse/core'
import { useStateConfig } from '~/composables/useStateConfig'

const STORAGE_KEY = 'swissgeo_app_state'

/**
 * Restoring a state
 *
 * This function restores a state either from the sessionStorage or
 * the URL parameter.
 */
export function useRestoreState() {
    async function restore() {
        const { exportState, importState } = useStateConfig()
        const { getStateFromUrl } = useUrlParams()
        const stateFromUrlParam = await getStateFromUrl()

        // If a valid state ID is present in URL, it takes precedance over the state in LocalStorage
        if (stateFromUrlParam) {
            const config = validateAndPrepareAppStatePayload(stateFromUrlParam)
            await importState(config)
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(config))
            return
        }

        // isImporting flag prevents writing back to sessionStorage immediately
        // after we just read from it during hydration.
        let isImporting = false

        // Restore state from sessionStorage on load
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY)
            if (stored) {
                isImporting = true
                const config = validateAndPrepareAppStatePayload(JSON.parse(stored))
                await importState(config)
                log.info('Restored app state from sessionStorage')
            }
        } catch (error) {
            log.warn('Failed to restore app state from sessionStorage, clearing stored state', {
                messages: [String(error)],
            })
            try {
                sessionStorage.removeItem(STORAGE_KEY)
            } catch {
                // sessionStorage not available, silently ignore
            }
        }

        // Watch for state changes and persist to sessionStorage
        watchDebounced(
            exportState,
            (newState) => {
                if (isImporting) {
                    isImporting = false
                    return
                }
                try {
                    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
                } catch (error) {
                    log.warn('Failed to persist app state to sessionStorage', {
                        messages: [String(error)],
                    })
                }
            },
            { deep: true, debounce: 500, immediate: false }
        )
    }

    function clear() {
        log.info('Clearing the session storage')
        sessionStorage.clear()
    }

    return {
        restore,
        clear,
    }
}
