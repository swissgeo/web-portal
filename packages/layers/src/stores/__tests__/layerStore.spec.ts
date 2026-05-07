import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'

import type { Layer } from '@/index'

import { useLayerStore } from '../layer'

function makeLayer(id: string): Layer {
    return {
        uuid: id,
        humanId: id,
        type: 'dataset',
        isLoading: false,
    }
}

describe('Layer store helpers', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('replaces a layer in place', () => {
        const store = useLayerStore()
        store.addLayer(makeLayer('a'))
        store.addLayer(makeLayer('b'))

        const replacement = makeLayer('replacement')
        store.replaceLayer('a', replacement)

        expect(store.layers.map((l) => l.uuid)).toEqual(['replacement', 'b'])

        // unknown uuid: no-op
        store.replaceLayer('missing', makeLayer('c'))
        expect(store.layers.map((l) => l.uuid)).toEqual(['replacement', 'b'])
    })
})
