/**
 * Vitest global setup for the `main` package.
 *
 * The Nuxt test environment (`vitest-environment-nuxt`) boots a real Nuxt app
 * per test file. Because no routes are registered in tests, the boot emits a
 * handful of warnings/errors that are harmless in this context but drown real
 * failures in the console.
 *
 * This setup file silences ONLY those known, expected messages — nothing else.
 * Any unrecognised warning or error still prints unchanged.
 */

import { afterAll, beforeAll } from 'vitest'

/**
 * Substrings of console messages that are known to come from booting the Nuxt
 * app inside a test with no real routes/data, and are safe to silence.
 *
 * Each entry must be specific enough that it cannot accidentally match a real
 * test failure. Prefer the longest unambiguous prefix.
 */
const SILENCED_PATTERNS = [
    // Vue Router cannot resolve "/" or locale-prefixed paths because no routes
    // are mounted in the test app.
    '[Vue Router warn]: No match found for location with path',
    // Nuxt's root layer surfaces the same "no route" condition as a 404.
    '[nuxt] error caught during app initialization',
    // Vue dev warning emitted when async components mount under <Suspense>.
    '<Suspense> is an experimental feature',
]

/**
 * True when the first console argument matches one of the silenced patterns.
 * Errors and Error-like objects are matched against their `message`.
 */
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
    return SILENCED_PATTERNS.some((pattern) => {
        return text.includes(pattern)
    })
}

const originalWarn = console.warn
const originalError = console.error

beforeAll(() => {
    console.warn = (...args: unknown[]) => {
        if (shouldSilence(args)) {
            return
        }
        originalWarn(...args)
    }
    console.error = (...args: unknown[]) => {
        if (shouldSilence(args)) {
            return
        }
        originalError(...args)
    }
})

afterAll(() => {
    console.warn = originalWarn
    console.error = originalError
})
