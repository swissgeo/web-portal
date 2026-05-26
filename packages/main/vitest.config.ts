import { defineVitestConfig } from "@nuxt/test-utils/config";

/**
 * `defineVitestConfig` auto-splits the suite into two Vitest projects:
 *
 *   |happy-dom|  — matches `*.spec.ts`, excludes `*.nuxt.spec.ts`.
 *   |nuxt|       — matches `*.nuxt.spec.ts` and `tests/nuxt/**.*`.
 *
 * Most tests should use happy-dom: stub Nuxt auto-imports via
 * `mockNuxtImport` from `@nuxt/test-utils/runtime` or `vi.hoisted`.
 * Only use `*.nuxt.spec.ts` when the test genuinely needs the Nuxt
 * runtime (routing, plugin lifecycle, SSR, mountSuspended).
 *
 * testTimeout is 30s because the Nuxt env boots a full app per file,
 * which can take a few seconds. Inert for happy-dom tests.
 *
 * setupFiles filters known-harmless Nuxt-boot noise (Vue Router "no
 * match", H3 404, Suspense warning). No-op in happy-dom.
 */
export default defineVitestConfig({
  test: {
    environment: "happy-dom",
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {},
  },
});
