import log, { LogPreDefinedColor } from '@swissgeo/log'
import { watchDebounced } from '@vueuse/core'
import { importStateFromBase64 } from '~/composables/stateImport/importStateFromBase64'
import { importStateFromService } from '~/composables/stateImport/importStateFromService'
import { importStateFromSessionStorage } from '~/composables/stateImport/importStateFromSessionStorage'
import { useStateConfig } from '~/composables/useStateConfig'

export const STORAGE_KEY = 'swissgeo_app_state'
/**
 * Restoring a state
 *
 * This function restores a state either from the sessionStorage or
 * the URL parameter.
 */
export function useRestoreState() {
    const { exportState } = useStateConfig()

    async function restore() {
        log.debug({
            title: 'useRestoreState',
            titleColor: LogPreDefinedColor.Sky,
            messages: ['About to restore state from URL or sessionStorage'],
        })

        // cascade the precedence of state restoring from
        // base64 -> state service -> sessionStorage
        const b64Restore = await importStateFromBase64()
        if (!b64Restore) {
            const serviceRestore = await importStateFromService()
            if (!serviceRestore) {
                const sessionStorageRestore = await importStateFromSessionStorage()
                if (!sessionStorageRestore) {
                    log.debug({
                        title: 'useRestoreState',
                        titleColor: LogPreDefinedColor.Sky,
                        messages: ['No state to be restored found'],
                    })
                    return false
                }
            }
        }
        return true
    }

    /** Create a watcher for the state changes
     *
     * Not doing that directly because the composable might be used in several places, resulting
     * in the watch being triggered in every place!
     */
    function listenToChange() {
        watchDebounced(
            exportState,
            (newState) => {
                try {
                    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
                    log.debug({
                        title: 'useRestoreState',
                        titleColor: LogPreDefinedColor.Sky,
                        messages: ['Storing the current state to the sessionStorage', newState],
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
    }

    /**
     * Clear the state in the session storage, restoring the default app config
     */
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
        listenToChange,
        clear,
    }
}
