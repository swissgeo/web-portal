import log from '@swissgeo/log'
import { watchDebounced } from '@vueuse/core'
import { useStateConfig } from '~/composables/useStateConfig'

const STORAGE_KEY = 'swissgeo_app_state'

export default defineNuxtPlugin({
    name: 'stateConfigSync',
    dependsOn: ['pinia'],

    hooks: {
        async 'app:created'() {
            const { exportState, importState } = useStateConfig()

            // isImporting flag prevents writing back to localStorage immediately
            // after we just read from it during hydration.
            let isImporting = false

            // Restore state from localStorage on load
            try {
                const stored = localStorage.getItem(STORAGE_KEY)
                if (stored) {
                    isImporting = true
                    await importState(stored)
                    log.info('Restored app state from localStorage')
                }
            } catch (error) {
                log.warn('Failed to restore app state from localStorage, clearing stored state', {
                    messages: [String(error)],
                })
                try {
                    localStorage.removeItem(STORAGE_KEY)
                } catch {
                    // localStorage not available, silently ignore
                }
            }

            // Watch for state changes and persist to localStorage
            watchDebounced(
                () => exportState(),
                (newState) => {
                    if (isImporting) {
                        isImporting = false
                        return
                    }
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
                    } catch (error) {
                        log.warn('Failed to persist app state to localStorage', {
                            messages: [String(error)],
                        })
                    }
                },
                { deep: true, debounce: 500, immediate: false }
            )
        },
    },
})
