import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { STORAGE_KEY } from '@/composables/useRestoreState'

// Stub defineNuxtPlugin and load centralised mock factories before imports.
const { watcherCallbackRef, mocks } = await vi.hoisted(async () => {
    ;(globalThis as Record<string, unknown>).defineNuxtPlugin = (plugin: unknown) => plugin
    const { nuxtMocks } = await import('../../../tests/mock-nuxt-imports')
    return {
        watcherCallbackRef: { fn: null as ((_state: unknown) => void) | null },
        mocks: nuxtMocks,
    }
})

const mockImportState = vi.fn()
const mockExportState = ref({
    version: 2,
    map: { center: [2600000, 1200000] as [number, number], zoom: 8, rotation: 0 },
    layers: [],
})

// useRestoreState chains into Nuxt composables (useToaster, useNuxtApp,
// useUrlParams → useRoute/useRouter). Stubbing them here avoids booting a
// full Nuxt app just for these dependencies. Factories from tests/mock-nuxt-imports.ts.
mockNuxtImport('useRoute', () => mocks.useRoute())
mockNuxtImport('useRouter', () => mocks.useRouter())
mockNuxtImport('onNuxtReady', () => mocks.onNuxtReady())
mockNuxtImport('useToaster', () => mocks.useToaster())
mockNuxtImport('useNuxtApp', () => mocks.useNuxtApp())

vi.mock('@swissgeo/log', async (importOriginal) => {
    const original = await importOriginal()
    return {
        // @ts-expect-error importOriginal returns unknown but spread works at runtime
        ...original,
        // @ts-expect-error same as above — override log methods with spies
        default: { ...original.default, info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }
})

// Bypass validation so the test focuses on the restore/persist flow, not the
// payload schema. validateAndPrepareAppStatePayload is tested in its own package.
vi.mock('@swissgeo/statesharing', () => ({
    validateAndPrepareAppStatePayload: (input: unknown) => input,
}))

vi.mock('@vueuse/core', async (importOriginal) => {
    const original = await importOriginal()
    return {
        // @ts-expect-error It works and this is a test
        ...original,
        watchDebounced: (_getter: unknown, callback: (_state: unknown) => void) => {
            watcherCallbackRef.fn = callback
        },
    }
})
vi.mock('@/composables/useUrlParams', () => ({
    useUrlParams: vi.fn(() => ({
        getStateFromUrl: null,
    })),
}))

vi.mock('~/composables/useStateConfig', () => ({
    useStateConfig: () => ({
        exportState: mockExportState,
        importState: mockImportState,
    }),
}))

// Import after mocks — defineNuxtPlugin is now stubbed to return its argument,
// so the default export is the raw plugin config object.
import plugin from '~/plugins/stateConfigSync.client'

type PluginConfig = { hooks: { 'app:created': () => Promise<void> } }
const pluginConfig = plugin as unknown as PluginConfig

/** Invoke the app:created hook and wait for it to complete. */
async function invokeHook() {
    watcherCallbackRef.fn = null
    await pluginConfig.hooks['app:created']()
}

describe('stateConfigSync plugin', () => {
    beforeEach(() => {
        sessionStorage.clear()
        vi.clearAllMocks()
        watcherCallbackRef.fn = null
    })

    describe('state restoration on load', () => {
        it('does not call importState when sessionStorage is empty', async () => {
            // const { restore } = useRestoreState()
            // await restore()
            await invokeHook()
            expect(mockImportState).not.toHaveBeenCalled()
        })

        it('calls importState with the stored JSON string when state is present', async () => {
            const state = {
                version: '1.0',
                state: {
                    map: { center: [2420001, 1030001], zoom: 10, rotation: 0 },
                    layers: [],
                },
            }
            const stored = JSON.stringify(state)
            sessionStorage.setItem(STORAGE_KEY, stored)

            await invokeHook()

            expect(mockImportState).toHaveBeenCalledWith(state)
        })

        it('removes the corrupt key and does not throw when importState fails', async () => {
            sessionStorage.setItem(STORAGE_KEY, 'not-valid-json')
            mockImportState.mockRejectedValueOnce(new Error('Parse error'))

            await expect(invokeHook()).resolves.not.toThrow()
            expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
        })
    })

    describe('reactive persistence', () => {
        it('sets up a watcher after the hook runs', async () => {
            await invokeHook()
            expect(watcherCallbackRef.fn).not.toBeNull()
        })

        it('writes state to sessionStorage when the watcher fires', async () => {
            await invokeHook()
            const state = mockExportState.value

            watcherCallbackRef.fn!(state)

            expect(sessionStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(state))
        })

        it('skips the first watcher fire after a successful import (isImporting flag)', async () => {
            const stored = JSON.stringify({
                version: 2,
                map: { center: [0, 0], zoom: 10, rotation: 0 },
                layers: [],
            })
            sessionStorage.setItem(STORAGE_KEY, stored)
            await invokeHook()
            sessionStorage.clear() // clear so we can detect any subsequent write

            // First fire after import → skipped
            watcherCallbackRef.fn!(mockExportState.value)
            expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()

            // Second fire → saved normally
            watcherCallbackRef.fn!(mockExportState.value)
            expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull()
        })

        it('does not skip the watcher fire when there was no prior import', async () => {
            await invokeHook() // no stored state → isImporting stays false

            watcherCallbackRef.fn!(mockExportState.value)

            expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull()
        })
    })
})
