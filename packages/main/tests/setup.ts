/**
 * Vitest setup file for *.nuxt.spec.ts tests.
 *
 * The Nuxt test environment boots a real Nuxt app per file. Because tests
 * typically don't register pages/routes, the boot emits harmless warnings
 * (Vue Router "no match", H3 404, Suspense dev notice) and plugin messages
 * (menus fetch, app banner, log levels). This file filters those specific
 * patterns so they don't cloud real failures.
 *
 * The filter only activates in the Nuxt env — detected via the
 * `__NUXT_VITEST_ENVIRONMENT__` flag that vitest-environment-nuxt sets
 * before setupFiles run. Happy-dom tests are completely unaffected.
 */

const isNuxtEnv =
    typeof window !== 'undefined' &&
    !!(window as Record<string, unknown>).__NUXT_VITEST_ENVIRONMENT__

if (isNuxtEnv) {
    const SILENCED_PATTERNS = [
        '[Vue Router warn]: No match found for location with path',
        '[nuxt] error caught during app initialization',
        '<Suspense> is an experimental feature',
        // Plugin boot messages — harmless in tests, no backend available.
        'No data received from menus',
        'SWISSGEO',
        'Version:',
        'Build Time:',
        'Setting the log levels to',
    ]

    function shouldSilence(args: unknown[]): boolean {
        const first = args[0]
        let text: string
        if (typeof first === 'string') {
            text = first
        } else if (first instanceof Error) {
            text = first.message
        } else {
            return false
        }
        return SILENCED_PATTERNS.some((pattern) => text.includes(pattern))
    }

    for (const method of ['log', 'info', 'warn', 'error'] as const) {
        const original = console[method].bind(console)
        console[method] = (...args: unknown[]) => {
            if (shouldSilence(args)) {
                return
            }
            original(...args)
        }
    }
}
