// Minimal vue-i18n stub for vitest.
// Replaces the real package (which is a transitive dep not directly accessible)
// so that components using useI18n() work in unit tests without a real i18n setup.
export function useI18n() {
    return { t: (key: string) => key }
}

export function createI18n() {
    return {}
}
