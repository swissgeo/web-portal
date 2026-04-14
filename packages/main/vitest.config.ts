import { defineVitestConfig } from '@nuxt/test-utils/config'

/**
 * `defineVitestConfig` auto-splits the suite into two Vitest projects:
 *
 *   |happy-dom|  — matches `*.spec.ts`, excludes `*.nuxt.spec.ts`.
 *   |nuxt|       — matches `*.nuxt.spec.ts` and `tests/nuxt/**.*`.
 *
 * All current tests run in happy-dom. Prefer staying there: stub Nuxt
 * auto-imports via `mockNuxtImport` from `@nuxt/test-utils/runtime` or
 * `vi.hoisted` instead of opting into the Nuxt env. Only use
 * `*.nuxt.spec.ts` when the test genuinely needs the Nuxt runtime.
 */
export default defineVitestConfig({
    test: {
        environment: 'happy-dom',
    },
    resolve: {
        alias: {
            // h3 is a Nitro transitive dep not directly accessible in pnpm;
            // redirect to a lightweight stub so server utils/routes compile in tests.
            // h3: resolve(__dirname, '../../test-utils/h3-stub.ts'),
        },
    },
})
