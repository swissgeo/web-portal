import { beforeEach, describe, expect, it, vi } from 'vitest'

const STORAGE_KEY = 'swissgeo_app_state'

// Stub defineNuxtPlugin before the plugin module is evaluated.
// It's a Nuxt auto-import (global), unavailable in the jsdom test environment.
// vi.hoisted runs before vi.mock and static imports, which is exactly what we need.
const watcherCallbackRef = vi.hoisted(() => {
    ;(globalThis as Record<string, unknown>).defineNuxtPlugin = (plugin: unknown) => plugin
    return { fn: null as ((_state: unknown) => void) | null }
})

const mockImportState = vi.fn()
const mockExportState = vi.fn(() => ({
    version: 2,
    map: { center: [2600000, 1200000] as [number, number], zoom: 8, rotation: 0 },
    layers: [],
}))

vi.mock('@swissgeo/log', () => ({
    default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@vueuse/core', () => ({
    watchDebounced: (_getter: unknown, callback: (_state: unknown) => void) => {
        watcherCallbackRef.fn = callback
    },
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
        localStorage.clear()
        vi.clearAllMocks()
        watcherCallbackRef.fn = null
    })

    describe('state restoration on load', () => {
        it('does not call importState when localStorage is empty', async () => {
            await invokeHook()
            expect(mockImportState).not.toHaveBeenCalled()
        })

        it('calls importState with the stored JSON string when state is present', async () => {
            const stored = JSON.stringify({
                version: 2,
                map: { center: [0, 0], zoom: 10, rotation: 0 },
                layers: [],
            })
            localStorage.setItem(STORAGE_KEY, stored)

            await invokeHook()

            expect(mockImportState).toHaveBeenCalledWith(stored)
        })

        it('removes the corrupt key and does not throw when importState fails', async () => {
            localStorage.setItem(STORAGE_KEY, 'not-valid-json')
            mockImportState.mockRejectedValueOnce(new Error('Parse error'))

            await expect(invokeHook()).resolves.not.toThrow()
            expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
        })
    })

    describe('reactive persistence', () => {
        it('sets up a watcher after the hook runs', async () => {
            await invokeHook()
            expect(watcherCallbackRef.fn).not.toBeNull()
        })

        it('writes state to localStorage when the watcher fires', async () => {
            await invokeHook()
            const state = mockExportState()

            watcherCallbackRef.fn!(state)

            expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(state))
        })

        it('skips the first watcher fire after a successful import (isImporting flag)', async () => {
            const stored = JSON.stringify({
                version: 2,
                map: { center: [0, 0], zoom: 10, rotation: 0 },
                layers: [],
            })
            localStorage.setItem(STORAGE_KEY, stored)
            await invokeHook()
            localStorage.clear() // clear so we can detect any subsequent write

            // First fire after import → skipped
            watcherCallbackRef.fn!(mockExportState())
            expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

            // Second fire → saved normally
            watcherCallbackRef.fn!(mockExportState())
            expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
        })

        it('does not skip the watcher fire when there was no prior import', async () => {
            await invokeHook() // no stored state → isImporting stays false

            watcherCallbackRef.fn!(mockExportState())

            expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
        })
    })
})
