import { defineVitestConfig } from '@nuxt/test-utils/config'

/**
 * Vitest is split into two projects automatically by `defineVitestConfig`
 * when the root `environment` is not `'nuxt'`:
 *
 *   |happy-dom|  — matches `*.spec.ts`, excludes `*.nuxt.spec.ts`.
 *                  Fast: no Nuxt app booted, no router/plugins initialised.
 *   |nuxt|       — matches `*.nuxt.spec.ts` and `tests/nuxt/**.*`.
 *                  Boots a full Nuxt app per file via vitest-environment-nuxt.
 *
 * Prefer the happy-dom project: stub Nuxt auto-imports via `mockNuxtImport`
 * from `@nuxt/test-utils/runtime` or `vi.hoisted` instead of opting into the
 * Nuxt env. Only use `*.nuxt.spec.ts` when the test genuinely exercises
 * Nuxt runtime behaviour.
 *
 * Both projects share `testTimeout`, `hookTimeout`, and `setupFiles`. The
 * timeouts are sized for the Nuxt env (app boot can eat a few seconds); unit
 * tests finish in milliseconds so the extra headroom is inert for them.
 */
export default defineVitestConfig({
    test: {
        environment: 'happy-dom',
        // Sized for Nuxt-env tests, which boot a full Nuxt app per file. A
        // 5s default is too tight for the first test in a file; 30s keeps
        // real hangs surfacing without flaky timeouts on cold boot.
        testTimeout: 30000,
        hookTimeout: 30000,
    },
    resolve: {
        alias: {
            // h3 is a Nitro transitive dep not directly accessible in pnpm;
            // redirect to a lightweight stub so server utils/routes compile in tests.
            // h3: resolve(__dirname, '../../test-utils/h3-stub.ts'),
        },
    },
})
