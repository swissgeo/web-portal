import type { AppStatePayload } from '@/types/types'

import { validateAppStatePayload } from '@/utils/validation'

export function validateAndPrepareAppStatePayload(json: unknown): AppStatePayload {
    const validatedJson = validateAppStatePayload(json)

    const payload = validatedJson

    if (payload.state.backgroundLayer) {
        payload.state.backgroundLayer.opacity = 1
    }
    return payload
}
