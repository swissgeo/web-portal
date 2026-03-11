import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'

import type { Layer } from '@/index'

import { useLayerStore } from '../layer'

function makeLayer(id: string): Layer {
    return {
        uuid: id,
        humanId: id,
        type: 'wms',
        opacity: 1,
        isVisible: true,
        isLoading: false,
    }
}

describe('Layer store helpers', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('adds layers and computes z-index correctly', () => {
        const store = useLayerStore()
        expect(store.layers.length).toBe(0)

        store.addLayer(makeLayer('a'))
        store.addLayer(makeLayer('b'))
        expect(store.layers.map((l) => l.uuid)).toEqual(['a', 'b'])
        expect(store.getLayerZIndex('a')).toBe(0)
        expect(store.getLayerZIndex('b')).toBe(1)
        expect(store.getLayerZIndex('missing')).toBe(-1)
    })

    it('replaces a layer in place', () => {
        const store = useLayerStore()
        store.addLayer(makeLayer('a'))
        store.addLayer(makeLayer('b'))

        const replacement = makeLayer('replacement')
        store.replaceLayer('a', replacement)

        expect(store.layers.map((l) => l.uuid)).toEqual(['replacement', 'b'])
        expect(store.getLayerZIndex('replacement')).toBe(0)
        expect(store.getLayerZIndex('a')).toBe(-1)

        // unknown uuid: no-op
        store.replaceLayer('missing', makeLayer('c'))
        expect(store.layers.map((l) => l.uuid)).toEqual(['replacement', 'b'])
    })

    it('setLayerIndex moves layers to specified index', () => {
        const store = useLayerStore()
        store.addLayer(makeLayer('a'))
        store.addLayer(makeLayer('b'))
        store.addLayer(makeLayer('c'))

        store.setLayerIndex('b', 0)
        expect(store.layers.map((l) => l.uuid)).toEqual(['b', 'a', 'c'])

        store.setLayerIndex('c', 1)
        expect(store.layers.map((l) => l.uuid)).toEqual(['b', 'c', 'a'])

        // invalid target indexes should have no effect
        store.setLayerIndex('a', -1)
        expect(store.layers.map((l) => l.uuid)).toEqual(['b', 'c', 'a'])
        store.setLayerIndex('a', 5)
        expect(store.layers.map((l) => l.uuid)).toEqual(['b', 'c', 'a'])

        // non-existent uuid should have no effect
        store.setLayerIndex('nonexistent', 0)
        expect(store.layers.map((l) => l.uuid)).toEqual(['b', 'c', 'a'])
    })

    it('moveLayerUp, moveLayerDown and moveLayerToTop work as expected', () => {
        const store = useLayerStore()
        store.addLayer(makeLayer('a'))
        store.addLayer(makeLayer('b'))
        store.addLayer(makeLayer('c'))

        store.moveLayerUp('a')
        expect(store.layers.map((l) => l.uuid)).toEqual(['b', 'a', 'c'])

        store.moveLayerDown('a')
        expect(store.layers.map((l) => l.uuid)).toEqual(['a', 'b', 'c'])

        store.moveLayerToTop('a')
        expect(store.layers.map((l) => l.uuid)).toEqual(['b', 'c', 'a'])

        // edge cases: moving top up or bottom down should be no-op
        store.moveLayerUp('a')
        expect(store.layers.map((l) => l.uuid)).toEqual(['b', 'c', 'a'])

        store.moveLayerDown('b')
        expect(store.layers.map((l) => l.uuid)).toEqual(['b', 'c', 'a'])
    })
})
