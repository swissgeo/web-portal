import { validateAndPrepareAppStatePayload } from '@swissgeo/statesharing'

import { GetAppStateResponse } from '@swissgeo/statesharing'

export async function importState(state: unknown, overrideZoomFromUrl?: number | null) {
    const { importState } = useStateConfig()

    const config = GetAppStateResponse.parse(state)

    // If a zoom is in URL, it overwrite the zoom from config
    // (used in the print feature)
    if (overrideZoomFromUrl) {
        config.state.map.zoom = overrideZoomFromUrl
    }
    await importState(config)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}
