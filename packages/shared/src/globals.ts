import type { Lang } from './language'

export const ALLOWED_LANGUAGES: Lang[] = ['de', 'fr']

export function getTailwindBreakpointPx(name: string, fallback: number): number {
    if (typeof window === 'undefined') {
        return fallback
    }
    const val = getComputedStyle(document.body).getPropertyValue(`--breakpoint-${name}`).trim()
    if (val.endsWith('rem')) {
        return parseFloat(val) * parseFloat(getComputedStyle(document.documentElement).fontSize)
    }
    if (val.endsWith('px')) {
        return parseFloat(val)
    }
    return fallback
}

export const MOBILE_BREAKPOINT = getTailwindBreakpointPx('sm', 640)
