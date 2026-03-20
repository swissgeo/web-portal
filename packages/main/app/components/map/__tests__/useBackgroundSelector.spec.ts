import type { Layer } from '@swissgeo/layers'

import useBackgroundSelector from '~/components/map/useBackgroundSelector'
import { describe, it, expect, vi } from 'vitest'

describe('useBackgroundSelector', () => {
    describe('selectorOpen', () => {
        it('starts closed', () => {
            const { selectorOpen } = useBackgroundSelector(vi.fn())
            expect(selectorOpen.value).toBe(false)
        })

        it('toggleShowSelector opens the selector', () => {
            const { selectorOpen, toggleShowSelector } = useBackgroundSelector(vi.fn())
            toggleShowSelector()
            expect(selectorOpen.value).toBe(true)
        })

        it('toggleShowSelector closes the selector when already open', () => {
            const { selectorOpen, toggleShowSelector } = useBackgroundSelector(vi.fn())
            toggleShowSelector()
            toggleShowSelector()
            expect(selectorOpen.value).toBe(false)
        })
    })

    describe('onSelectBackground', () => {
        it('calls the provided callback with the selected layer', () => {
            const callback = vi.fn()
            const { onSelectBackground } = useBackgroundSelector(callback)
            const layer = null
            onSelectBackground(layer)
            expect(callback).toHaveBeenCalledWith(layer)
        })

        it('closes the selector after selection', () => {
            const { selectorOpen, toggleShowSelector, onSelectBackground } = useBackgroundSelector(
                vi.fn()
            )
            toggleShowSelector() // open
            onSelectBackground(null)
            expect(selectorOpen.value).toBe(false)
        })
    })

    describe('getImageForBackgroundLayer', () => {
        it('returns a URL for pixelkarte-farbe', () => {
            const { getImageForBackgroundLayer } = useBackgroundSelector(vi.fn())
            const layer = {
                data: { id: 'ch.swisstopo.pixelkarte-farbe' },
            } as unknown as Layer
            const url = getImageForBackgroundLayer(layer)
            expect(url).toBeTruthy()
            expect(url).toContain('pixelkarte-farbe')
        })

        it('returns a URL for pixelkarte-grau', () => {
            const { getImageForBackgroundLayer } = useBackgroundSelector(vi.fn())
            const layer = {
                data: { id: 'ch.swisstopo.pixelkarte-grau' },
            } as unknown as Layer
            expect(getImageForBackgroundLayer(layer)).toContain('pixelkarte-grau')
        })

        it('returns a URL for swissimage', () => {
            const { getImageForBackgroundLayer } = useBackgroundSelector(vi.fn())
            const layer = {
                data: { id: 'ch.swisstopo.swissimage' },
            } as unknown as Layer
            expect(getImageForBackgroundLayer(layer)).toContain('swissimage')
        })

        it('returns a URL for null background', () => {
            const { getImageForBackgroundLayer } = useBackgroundSelector(vi.fn())
            expect(getImageForBackgroundLayer(null)).toContain('void')
        })

        it('falls back to the void image when no layer is provided', () => {
            const { getImageForBackgroundLayer } = useBackgroundSelector(vi.fn())
            expect(getImageForBackgroundLayer(undefined)).toContain('void')
        })

        it('falls back to the void image for an unknown layer id', () => {
            const { getImageForBackgroundLayer } = useBackgroundSelector(vi.fn())
            const layer = { data: { id: 'unknown.layer' } } as unknown as Layer
            expect(getImageForBackgroundLayer(layer)).toContain('void')
        })

        it('returns distinct URLs for different layer types', () => {
            const { getImageForBackgroundLayer } = useBackgroundSelector(vi.fn())
            const farbe = getImageForBackgroundLayer({
                data: { id: 'ch.swisstopo.pixelkarte-farbe' },
            } as unknown as Layer)
            const grau = getImageForBackgroundLayer({
                data: { id: 'ch.swisstopo.pixelkarte-grau' },
            } as unknown as Layer)
            const aerial = getImageForBackgroundLayer({
                data: { id: 'ch.swisstopo.swissimage' },
            } as unknown as Layer)
            const voidImg = getImageForBackgroundLayer(null)

            expect(new Set([farbe, grau, aerial, voidImg]).size).toBe(4)
        })
    })
})
