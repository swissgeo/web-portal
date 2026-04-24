/* eslint-disable no-console */
/**
 * Vitest setup file for *.nuxt.spec.ts tests.
 *
 * The Nuxt test environment boots a real Nuxt app per file. Because tests
 * typically don't register pages/routes, the boot emits harmless warnings
 * (Vue Router "no match", H3 404, Suspense dev notice, menus fetch).
 * This file filters those specific patterns so they don't cloud real
 * failures. Informational plugin messages (app banner, log levels) are
 * kept — they confirm the app booted with the right config.
 *
 * The filter only activates in the Nuxt env — detected via the
 * `__NUXT_VITEST_ENVIRONMENT__` flag that vitest-environment-nuxt sets
 * before setupFiles run. Happy-dom tests are completely unaffected.
 */

import { vi } from 'vitest'

// neutralise the stateConfigSync plugin, otherwise the app created hook will run this
// and potentially interfere with the tests
vi.mock('~/composables/useRestoreState', () => ({
    useRestoreState: () => ({
        restore: vi.fn().mockResolvedValue(undefined),
        listenToChange: vi.fn(),
    }),
}))

const isNuxtEnv =
    typeof window !== 'undefined' &&
    !!(window as Record<string, unknown>).__NUXT_VITEST_ENVIRONMENT__

if (isNuxtEnv) {
    const SILENCED_PATTERNS = [
        // No pages registered in tests → router can't resolve "/" or "/de".
        // Can't fix: Vue Router's internal warn() fires during Nuxt boot before
        // any test code runs. No hook to register routes early enough.
        '[Vue Router warn]: No match found for location with path',
        // Nuxt's error layer surfaces the same no-route condition as a 404.
        // Can't fix: same root cause as the Vue Router warn above.
        '[nuxt] error caught during app initialization',
        // Vue dev warning when any component tree uses <Suspense> (Nuxt wraps
        // pages in it). Can't fix: Vue upstream — Suspense is still experimental.
        '<Suspense> is an experimental feature',
        // addRoutes.ts plugin calls useFetch for menu data — no backend in tests.
        // Can't mock: plugins run during Nuxt boot before setupFiles or test code.
        'No data received from menus',
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
