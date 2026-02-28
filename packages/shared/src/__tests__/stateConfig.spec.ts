import { describe, it, expect } from 'vitest'

import { parseAppState } from '../stateConfig'
import type { AppStateConfig } from '../stateConfig'

const validState: AppStateConfig = {
    version: 1,
    map: {
        center: [7.4474, 46.948],
        zoom: 10,
        rotation: 0,
    },
    layers: [
        {
            humanId: 'ch.swisstopo.pixelkarte-farbe',
            type: 'wmts',
            isVisible: true,
            opacity: 1,
            zIndex: 1,
        },
    ],
}

describe('parseAppState', () => {
    it('accepts a valid state config', () => {
        const result = parseAppState(validState)
        expect(result).toEqual(validState)
    })

    it('accepts a state with backgroundLayer', () => {
        const state = {
            ...validState,
            backgroundLayer: {
                humanId: 'ch.swisstopo.background',
                type: 'wmts',
                isVisible: true,
                opacity: 1,
                zIndex: 0,
            },
        }
        const result = parseAppState(state)
        expect(result.backgroundLayer).toBeDefined()
    })

    it('accepts a state with null backgroundLayer', () => {
        const state = { ...validState, backgroundLayer: null }
        const result = parseAppState(state)
        expect(result.backgroundLayer).toBeNull()
    })

    it('accepts a state with empty layers array', () => {
        const state = { ...validState, layers: [] }
        const result = parseAppState(state)
        expect(result.layers).toEqual([])
    })

    it('accepts a layer with dimensions', () => {
        const state = {
            ...validState,
            layers: [
                {
                    humanId: 'ch.swisstopo.zeitreihen',
                    type: 'wms',
                    isVisible: true,
                    opacity: 0.8,
                    zIndex: 1,
                    dimensions: {
                        time: { currentValue: '2020' },
                    },
                },
            ],
        }
        const result = parseAppState(state)
        expect(result.layers[0]!.dimensions).toEqual({
            time: { currentValue: '2020' },
        })
    })

    it('rejects null input', () => {
        expect(() => parseAppState(null)).toThrow('must be a non-null object')
    })

    it('rejects non-object input', () => {
        expect(() => parseAppState('string')).toThrow('must be a non-null object')
    })

    it('rejects unsupported version', () => {
        expect(() => parseAppState({ ...validState, version: 2 })).toThrow(
            'Unsupported state config version'
        )
    })

    it('rejects missing version', () => {
        const { version: _, ...noVersion } = validState
        expect(() => parseAppState(noVersion)).toThrow('Unsupported state config version')
    })

    it('rejects missing map', () => {
        const { map: _, ...noMap } = validState
        expect(() => parseAppState({ ...noMap, version: 1 })).toThrow(
            'must include a "map" object'
        )
    })

    it('rejects invalid center', () => {
        expect(() =>
            parseAppState({
                ...validState,
                map: { ...validState.map, center: [1] },
            })
        ).toThrow('map.center must be a [lon, lat] number array')
    })

    it('rejects negative zoom', () => {
        expect(() =>
            parseAppState({
                ...validState,
                map: { ...validState.map, zoom: -1 },
            })
        ).toThrow('map.zoom must be a non-negative number')
    })

    it('rejects non-number rotation', () => {
        expect(() =>
            parseAppState({
                ...validState,
                map: { ...validState.map, rotation: 'abc' },
            })
        ).toThrow('map.rotation must be a number')
    })

    it('rejects missing layers', () => {
        const { layers: _, ...noLayers } = validState
        expect(() => parseAppState({ ...noLayers, version: 1 })).toThrow(
            'must include a "layers" array'
        )
    })

    it('rejects layer with missing humanId', () => {
        expect(() =>
            parseAppState({
                ...validState,
                layers: [{ type: 'wms', isVisible: true, opacity: 1, zIndex: 1 }],
            })
        ).toThrow('layers[0].humanId must be a string')
    })

    it('rejects layer with opacity out of range', () => {
        expect(() =>
            parseAppState({
                ...validState,
                layers: [
                    {
                        humanId: 'test',
                        type: 'wms',
                        isVisible: true,
                        opacity: 1.5,
                        zIndex: 1,
                    },
                ],
            })
        ).toThrow('layers[0].opacity must be a number between 0 and 1')
    })

    it('rejects invalid backgroundLayer', () => {
        expect(() =>
            parseAppState({
                ...validState,
                backgroundLayer: { humanId: 'test' },
            })
        ).toThrow('backgroundLayer.type must be a string')
    })
})
