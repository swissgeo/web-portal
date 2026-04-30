import type { RouteLocationNormalized } from 'vue-router'

export function isRootPath(path: string) {
    return path === '/'
}

/**
 * List of paths that should *not* be localized
 */
export function isExempt(path: string) {
    if (path === '/health') {
        return true
    }
}

export function isLocaleRoot(path: string) {
    const { $i18n } = useNuxtApp()

    return $i18n.localeCodes.value.some((code) => path === `/${code}` || path === `/${code}/`)
}

export function isLocalized(path: string) {
    const { $i18n } = useNuxtApp()

    const pathParts = path.split('/')
    const firstPart = pathParts[1] // the first element is an empty string

    return $i18n.localeCodes.value.some((code) => firstPart === code)
}

export function redirector(to: Pick<RouteLocationNormalized, 'path' | 'query'>) {
    const localePath = useLocalePath()

    if (isExempt(to.path)) {
        return
    } else if (isRootPath(to.path) || isLocaleRoot(to.path)) {
        return navigateTo({ path: localePath('/map'), query: to.query }, { redirectCode: 301 })
    } else if (!isLocalized(to.path)) {
        // it's not localized, but is a sepcific path. We prepend the locale instead of redirecting to map
        return navigateTo({ path: localePath(to.path), query: to.query }, { redirectCode: 301 })
    }
}

/**
 * Redirect the user with following pattern:
 * * | /                  | <locale>/map       |
 * * | /map               | /<locale>/map      |
 * * | /<locale>/map      | _no redirect_      |
 * * | /<locale>          | /<locale>/map      |
 * * | /anything          | /<locale>/anything |
 * * | /<locale>/anything | _no redirect_      |
 */
export default defineNuxtRouteMiddleware(redirector)
