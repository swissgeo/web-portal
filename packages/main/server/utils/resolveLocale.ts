import type { Lang } from '@swissgeo/shared'
import type { H3Event } from 'h3'

import { VALID_LOCALES } from '@swissgeo/shared'
import { parseCookies } from 'h3'

/**
 * Resolves the user's preferred locale from the i18n_redirected cookie,
 * falling back to 'de' when no valid cookie is present.
 */
export function resolveLocale(event: H3Event): Lang {
    const cookies = parseCookies(event)
    const saved = cookies['i18n_redirected']
    return saved && (VALID_LOCALES as readonly string[]).includes(saved) ? (saved as Lang) : 'de'
}
