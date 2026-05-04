import log, { LogPreDefinedColor } from '@swissgeo/log'

import { importState } from './importState'

/**
 * Import a state from the base64 encoded string in the query
 *
 * @returns whether there was something imported
 */
export async function importStateFromBase64(): Promise<boolean> {
    const { getB64State } = useUrlParams()

    const toaster = useToaster()
    const { $i18n } = useNuxtApp()

    try {
        const state = getB64State()

        if (state) {
            log.debug({
                title: 'useImportStateFromBase64',
                titleColor: LogPreDefinedColor.Sky,
                messages: ['B64 State from the URL param', state],
            })
            await importState(state)

            log.info({
                title: 'useImportStateFromBase64',
                titleColor: LogPreDefinedColor.Sky,
                messages: ['Restored app state from base64 URL string'],
            })
            return true
        }
    } catch {
        log.error({
            title: 'useImportStateFromBase64',
            titleColor: LogPreDefinedColor.Sky,
            messages: ['State restoration is unsuccessful'],
        })
        toaster.showWarning($i18n.t('state.restoreUnableWarning'))
    }
    return false
}
