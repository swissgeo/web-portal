import log, { LogPreDefinedColor } from '@swissgeo/log'
import { getAppStateApiStateStateIdGet } from '@swissgeo/statesharing'

import { importState } from './importState'
/**
 * Import a state from the service by the state ID the URL
 *
 * @returns if there was a state restored
 */
export async function importStateFromService(): Promise<boolean> {
    const viewStore = useMapViewStore()
    const { getZoomFromUrl } = useUrlParams()

    const toaster = useToaster()
    const { $i18n } = useNuxtApp()

    try {
        const { state: stateFromUrlParam, stateId } = await getAppStateApiStateStateIdGet()

        log.debug({
            title: 'importStateFromService',
            titleColor: LogPreDefinedColor.Sky,
            messages: ['State from the URL param', stateFromUrlParam],
        })

        if (stateFromUrlParam && stateId) {
            const overrideZoomFromUrl = getZoomFromUrl()
            viewStore.setStateId(stateId)

            await importState(stateFromUrlParam, overrideZoomFromUrl)
            log.info({
                title: 'importStateFromService',
                titleColor: LogPreDefinedColor.Sky,
                messages: ['Restored app state from state service'],
            })

            return true
        }
    } catch {
        log.error({
            title: 'importStateFromService',
            titleColor: LogPreDefinedColor.Sky,
            messages: ['State restoration is unsuccessful'],
        })
        toaster.showWarning($i18n.t('state.restoreUnableWarning'))
    }

    return false
}
