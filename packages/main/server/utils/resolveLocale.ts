import type { H3Event } from 'h3'
import { parseCookies } from 'h3'

const VALID_LOCALES = ['de', 'fr', 'en', 'it', 'rm'] as const
type Locale = (typeof VALID_LOCALES)[number]

/**
 * Resolves the user's preferred locale from the i18n_redirected cookie,
 * falling back to 'de' when no valid cookie is present.
 */
export function resolveLocale(event: H3Event): Locale {
    const cookies = parseCookies(event)
    const saved = cookies['i18n_redirected']
    return saved && (VALID_LOCALES as readonly string[]).includes(saved)
        ? (saved as Locale)
        : 'de'
}
