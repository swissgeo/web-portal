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

// Install the filters at module-evaluation time so they catch messages emitted
// during Nuxt boot / component module load, which happens before any Vitest
// lifecycle hook (beforeAll) would fire. The filters stay active for the
// entire process — fine for test runs, and there is no teardown to worry
// about since the process exits at the end.
//
// We patch log/info/warn/error because Vue's "<Suspense> is experimental"
// notice goes through one of the stdout channels (log/info), not warn/error.
for (const method of ['log', 'info', 'warn', 'error'] as const) {
    const original = console[method].bind(console)
    console[method] = (...args: unknown[]) => {
        if (shouldSilence(args)) {
            return
        }
        original(...args)
    }
}
