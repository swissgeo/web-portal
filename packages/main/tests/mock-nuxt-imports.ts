/**
 * Predefined mock factories for common Nuxt auto-imports.
 *
 * `mockNuxtImport` is a compile-time macro — Nuxt's Vite plugin parses
 * the AST statically, so each call must have a string literal as its
 * first argument. This means we can't wrap calls in a loop or helper
 * function. This module centralises the mock implementations so they
 * stay consistent across tests and only need updating in one place.
 *
 * Usage (at the top level of a *.spec.ts file):
 *
 *   import { mockNuxtImport } from '@nuxt/test-utils/runtime'
 *
 *   const { mocks } = await vi.hoisted(async () => {
 *       const { nuxtMocks } = await import('../../../tests/mock-nuxt-imports')
 *       return { mocks: nuxtMocks }
 *   })
 *
 *   mockNuxtImport('useRoute', () => mocks.useRoute())
 *   mockNuxtImport('useRouter', () => mocks.useRouter())
 */
import { vi } from 'vitest'

export const nuxtMocks = {
    useRoute: () => () => ({ query: {} }),
    useRouter: () => () => ({ replace: vi.fn(), afterEach: vi.fn() }),
    onNuxtReady: () => vi.fn(),
    useToaster: () => () => ({ showWarning: vi.fn(), showError: vi.fn() }),
    useNuxtApp: () => () => ({ $i18n: { t: vi.fn((key: string) => key) } }),
}
