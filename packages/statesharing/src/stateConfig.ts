import type { AppStateConfig } from '@/types/types'

import { validateAppState } from '@/utils/validation'

export function validateAndPrepareAppStateConfig(json: JSON): AppStateConfig {
    const validatedJson = validateAppState(json)

    if (validatedJson.backgroundLayer) {
        validatedJson.backgroundLayer.opacity = 1
    }
    return validatedJson
}
