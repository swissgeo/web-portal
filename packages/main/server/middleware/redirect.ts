import { VALID_LOCALES } from '@swissgeo/shared'

const DEFAULT_LOCALE = 'de'

// Paths that should never be redirected by this middleware
const EXEMPT_PREFIXES = ['/api/', '/_nxt/', '/__nuxt_island/', '/_nuxt/']

function isExempt(path: string): boolean {
    if (path === '/health') {
        return true
    }
    if (EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix))) {
        return true
    }
    // Skip paths that look like static asset files
    const lastSegment = path.split('/').pop() ?? ''
    if (lastSegment.includes('.')) {
        return true
    }
    return false
}

function getPreferredLocale(event: Parameters<typeof getCookie>[0]): string {
    const cookie = getCookie(event, 'i18n_redirected')
    if (cookie && (VALID_LOCALES as readonly string[]).includes(cookie)) {
        return cookie
    }
    return DEFAULT_LOCALE
}

/**
 * Handles locale redirects at the Nitro level, before Vue SSR starts.
 * This mirrors the redirect.global.ts Vue Router middleware but runs
 * server-side so that redirect paths never trigger app:created hooks
 * (and therefore never make unnecessary Livingdocs API calls).
 *
 * redirect.global.ts still handles client-side SPA navigation.
 */
export default defineEventHandler((event) => {
    const url = getRequestURL(event)
    const path = url.pathname
    const query = url.search ?? ''

    if (isExempt(path)) {
        return
    }

    const firstSegment = path.split('/')[1] ?? ''
    const isLocalized = (VALID_LOCALES as readonly string[]).includes(firstSegment)

    if (isLocalized) {
        // /<locale> or /<locale>/ with no further path → redirect to /<locale>/map
        const rest = path.split('/').slice(2).filter(Boolean).join('/')
        if (!rest) {
            return sendRedirect(event, `/${firstSegment}/map${query}`, 301)
        }
        // Already properly localized with a path — no redirect needed
        return
    }

    const locale = getPreferredLocale(event)

    // / → /<locale>/map
    if (path === '/') {
        return sendRedirect(event, `/${locale}/map${query}`, 301)
    }

    // /anything → /<locale>/anything (e.g. /map → /<locale>/map)
    return sendRedirect(event, `/${locale}${path}${query}`, 301)
})
