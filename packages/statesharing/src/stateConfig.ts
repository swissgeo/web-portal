import type { AppStateConfig } from '@/types/types'

import { validateAppState } from '@/utils/validation'

export function validateAndPrepareAppStateConfig(rawJson: unknown): AppStateConfig {
    const validatedJson = validateAppState(rawJson)

    if (validatedJson.backgroundLayer) {
        validatedJson.backgroundLayer.opacity = 1
    }
    return validatedJson
}
