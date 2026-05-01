import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSearchSelection } from '../useSearchSelection'

const { navigateToMock, localePathMock } = vi.hoisted(() => ({
    navigateToMock: vi.fn(),
    localePathMock: vi.fn((path: string) => path),
}))

mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useLocalePath', () => () => localePathMock)

vi.mock('@swissgeo/map', () => ({
    usePositionStore: () => ({
        setCenter: vi.fn(),
        setZoom: vi.fn(),
    }),
}))

describe('useSearchSelection', () => {
    beforeEach(() => {
        ;(process as { client?: boolean }).client = true
        navigateToMock.mockReset()
        localePathMock.mockReset()
        localePathMock.mockImplementation((path: string) => path)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('navigates to the dataset page when a layer result is selected', async () => {
        const { handleResultSelection } = useSearchSelection()

        await handleResultSelection({
            resultType: 'LAYER',
            layerId: 'ch.layer.one',
        } as never)

        expect(localePathMock).toHaveBeenCalledWith('/dataset/ch.layer.one')
        expect(navigateToMock).toHaveBeenCalledWith('/dataset/ch.layer.one')
    })
})
