export const VALID_LOCALES = ['de', 'fr', 'it', 'en', 'rm'] as const
export type Lang = (typeof VALID_LOCALES)[number]

// Fallback locale used when no Accept-Language tag matches a supported locale.
// Mirrored from nuxt.config.ts i18n.defaultLocale; kept here as the single
// source of truth shared between the Nitro middleware and the Vue middleware.
export const DEFAULT_LOCALE: Lang = 'de'

/**
 * Pick the first supported locale from an Accept-Language header.
 *
 * Quality parameters (`;q=0.8`) are ignored; tags are consulted in the order
 * they appear. Regional subtags fall back to their primary tag (`fr-CH` → `fr`).
 *
 * Returns `undefined` when the header is empty or no tag matches.
 */
export function pickLocaleFromAcceptLanguage<T extends string>(
    header: string | undefined,
    supported: readonly T[]
): T | undefined {
    if (!header) {
        return undefined
    }
    const tags = header
        .split(',')
        .map((tag) => tag.split(';')[0].trim().toLowerCase())
        .filter((tag) => tag.length > 0)
    for (const tag of tags) {
        const primary = tag.split('-')[0] as T
        if (supported.includes(primary)) {
            return primary
        }
    }
    return undefined
}
