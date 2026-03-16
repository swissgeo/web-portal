import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const mockNavigateTo = vi.fn()
const mockLocalePath = vi.fn((path: string) => path)

vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('useLocalePath', () => mockLocalePath)

import IndexPage from '~/pages/index.vue'

describe('index.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('redirects to /map for the default locale', async () => {
        mockLocalePath.mockImplementation((path: string) => path)

        mount(IndexPage)
        await vi.dynamicImportSettled()

        expect(mockLocalePath).toHaveBeenCalledWith('/map')
        expect(mockNavigateTo).toHaveBeenCalledWith('/map', { replace: true })
    })

    it('redirects to /fr/map when the French locale is active', async () => {
        mockLocalePath.mockImplementation((path: string) => `/fr${path}`)

        mount(IndexPage)
        await vi.dynamicImportSettled()

        expect(mockLocalePath).toHaveBeenCalledWith('/map')
        expect(mockNavigateTo).toHaveBeenCalledWith('/fr/map', { replace: true })
    })
})
