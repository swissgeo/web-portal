import log from '@swissgeo/log'
import { validateAndPrepareAppStateConfig } from '@swissgeo/statesharing'
import { watchDebounced } from '@vueuse/core'
import { useStateConfig } from '~/composables/useStateConfig'

const STORAGE_KEY = 'swissgeo_app_state'

export default defineNuxtPlugin({
    name: 'stateConfigSync',
    dependsOn: ['pinia'],

    hooks: {
        async 'app:created'() {
            const { exportState, restoreState } = useStateConfig()
            const { getStateFromUrl } = useUrlParams()
            const stateFromUrlParam = await getStateFromUrl()

            // If a valid state ID is preent in URL, it takes precedance over the state in LocalStorage
            if (stateFromUrlParam) {
                const config = validateAndPrepareAppStateConfig(stateFromUrlParam)
                await restoreState(config)
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
                    const config = validateAndPrepareAppStateConfig(JSON.parse(stored))
                    await restoreState(config)
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
        },
    },
})
