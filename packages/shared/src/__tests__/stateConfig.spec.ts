import { describe, it, expect } from 'vitest'

import type { AppStateConfig } from '../stateConfig'

import { parseAppState } from '../stateConfig'

const validState: AppStateConfig = {
    version: 2,
    map: {
        center: [2600000, 1200000],
        zoom: 10,
        rotation: 0,
    },
    layers: [
        {
            layerUrl: 'https://api.example.com/ogc/items/ch.swisstopo.pixelkarte-farbe',
            type: 'wmts',
            isVisible: true,
            opacity: 1,
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
                datasetUrl: 'https://api.example.com/ogc/items/ch.swisstopo.background',
                type: 'wmts',
                isVisible: true,
                opacity: 1,
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
                    datasetUrl: 'https://api.example.com/ogc/items/ch.swisstopo.zeitreihen',
                    type: 'wms',
                    isVisible: true,
                    opacity: 0.8,
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
        expect(() => parseAppState({ ...validState, version: 1 })).toThrow(
            'Unsupported state config version'
        )
    })

    it('rejects missing version', () => {
        expect(() => parseAppState({ map: validState.map, layers: validState.layers })).toThrow(
            'Unsupported state config version'
        )
    })

    it('rejects missing map', () => {
        expect(() => parseAppState({ version: 2, layers: validState.layers })).toThrow(
            'must include a "map" object'
        )
    })

    it('rejects invalid center', () => {
        expect(() =>
            parseAppState({
                ...validState,
                map: { ...validState.map, center: [1] },
            })
        ).toThrow('map.center must be a [x, y] number array in LV95 (EPSG:2056)')
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
        expect(() => parseAppState({ version: 2, map: validState.map })).toThrow(
            'must include a "layers" array'
        )
    })

    it('rejects layer with missing datasetUrl', () => {
        expect(() =>
            parseAppState({
                ...validState,
                layers: [{ type: 'wms', isVisible: true, opacity: 1 }],
            })
        ).toThrow('layers[0].datasetUrl must be a string')
    })

    it('rejects layer with opacity out of range', () => {
        expect(() =>
            parseAppState({
                ...validState,
                layers: [
                    {
                        datasetUrl: 'https://api.example.com/ogc/items/test',
                        type: 'wms',
                        isVisible: true,
                        opacity: 1.5,
                    },
                ],
            })
        ).toThrow('layers[0].opacity must be a number between 0 and 1')
    })

    it('rejects invalid backgroundLayer', () => {
        expect(() =>
            parseAppState({
                ...validState,
                backgroundLayer: { datasetUrl: 'https://api.example.com/ogc/items/test' },
            })
        ).toThrow('backgroundLayer.type must be a string')
    })
})
