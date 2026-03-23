import { describe, it, expect } from 'vitest'

import type { AppStateConfig } from '@/types/types'

import { APP_STATE_CONFIG_VERSION } from '@/constants'
import { validateAndPrepareAppStateConfig } from '@/stateConfig'

const validState: AppStateConfig = {
    version: APP_STATE_CONFIG_VERSION,
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

describe('validateAndPrepareAppStateConfig', () => {
    it('accepts a valid state config', () => {
        const result = validateAndPrepareAppStateConfig(validState)
        expect(result).toEqual(validState)
    })

    it('accepts a state with backgroundLayer', () => {
        const state = {
            ...validState,
            backgroundLayer: {
                layerUrl: 'https://api.example.com/ogc/items/ch.swisstopo.background',
                type: 'wmts',
                isVisible: true,
                opacity: 1,
            },
        }
        const result = validateAndPrepareAppStateConfig(state)
        expect(result.backgroundLayer).toBeDefined()
    })

    it('accepts a state with null backgroundLayer', () => {
        const state = { ...validState, backgroundLayer: null }
        const result = validateAndPrepareAppStateConfig(state)
        expect(result.backgroundLayer).toBeNull()
    })

    it('accepts a state with empty layers array', () => {
        const state = { ...validState, layers: [] }
        const result = validateAndPrepareAppStateConfig(state)
        expect(result.layers).toEqual([])
    })

    it('accepts a layer with dimensions', () => {
        const state = {
            ...validState,
            layers: [
                {
                    layerUrl: 'https://api.example.com/ogc/items/ch.swisstopo.zeitreihen',
                    type: 'wms',
                    isVisible: true,
                    opacity: 0.8,
                    dimensions: {
                        time: { currentValue: '2020' },
                    },
                },
            ],
        }
        const result = validateAndPrepareAppStateConfig(state)
        expect(result.layers[0]!.dimensions).toEqual({
            time: { currentValue: '2020' },
        })
    })

    it('rejects null input', () => {
        expect(() => validateAndPrepareAppStateConfig(null)).toThrow('must be a non-null object')
    })

    it('rejects non-object input', () => {
        expect(() => validateAndPrepareAppStateConfig('string')).toThrow(
            'must be a non-null object'
        )
    })

    it('rejects unsupported version', () => {
        expect(() => validateAndPrepareAppStateConfig({ ...validState, version: 1 })).toThrow(
            'Unsupported state config version'
        )
    })

    it('rejects missing version', () => {
        expect(() =>
            validateAndPrepareAppStateConfig({ map: validState.map, layers: validState.layers })
        ).toThrow('Mandatory key "version" not present in the state')
    })

    it('rejects missing map', () => {
        expect(() =>
            validateAndPrepareAppStateConfig({ version: 2, layers: validState.layers })
        ).toThrow('Mandatory key "map" not present in the state')
    })

    it('rejects invalid center', () => {
        expect(() =>
            validateAndPrepareAppStateConfig({
                ...validState,
                map: { ...validState.map, center: [1] },
            })
        ).toThrow('Center should be an array of two numbers')
    })

    it('rejects negative zoom', () => {
        expect(() =>
            validateAndPrepareAppStateConfig({
                ...validState,
                map: { ...validState.map, zoom: -1 },
            })
        ).toThrow('map.zoom must be a non-negative number')
    })

    it('rejects non-number rotation', () => {
        expect(() =>
            validateAndPrepareAppStateConfig({
                ...validState,
                map: { ...validState.map, rotation: 'abc' },
            })
        ).toThrow('rotation attribute should be a number')
    })

    it('rejects missing layers', () => {
        expect(() => validateAndPrepareAppStateConfig({ version: 2, map: validState.map })).toThrow(
            'Mandatory key "layers" not present in the state'
        )
    })

    it('rejects layer with missing layerUrl', () => {
        expect(() =>
            validateAndPrepareAppStateConfig({
                ...validState,
                layers: [{ type: 'wms', isVisible: true, opacity: 1 }],
            })
        ).toThrow('mandatory attribute layerUrl not present in layer state configuration')
    })

    it('rejects layer with opacity out of range', () => {
        const layerUrl = 'https://api.example.com/ogc/items/test'
        expect(() =>
            validateAndPrepareAppStateConfig({
                ...validState,
                layers: [
                    {
                        layerUrl,
                        type: 'wms',
                        isVisible: true,
                        opacity: 1.5,
                    },
                ],
            })
        ).toThrow(`${layerUrl} opacity must be a number between 0 and 1`)
    })

    it('rejects invalid backgroundLayer', () => {
        expect(() =>
            validateAndPrepareAppStateConfig({
                ...validState,
                backgroundLayer: { layerUrl: 'https://api.example.com/ogc/items/test' },
            })
        ).toThrow('mandatory attribute type not present in layer state configuration')
    })
})
