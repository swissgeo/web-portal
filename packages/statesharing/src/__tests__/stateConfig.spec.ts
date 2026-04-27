import { describe, it, expect } from 'vitest'

import type { AppStateConfig, AppStatePayload } from '@/types/types'

import { APP_STATE_CONFIG_CONSTRAINT, APP_STATE_CONFIG_VERSION } from '@/constants'
import { validateAndPrepareAppStatePayload } from '@/stateConfig'

const VERSION = APP_STATE_CONFIG_VERSION

const validState: AppStateConfig = {
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

const validPayload: AppStatePayload = {
    version: VERSION,
    state: validState,
}

describe('validateAndPrepareAppStatePayload', () => {
    it('accepts a valid state config', () => {
        const result = validateAndPrepareAppStatePayload(validPayload)
        expect(result).toEqual(validPayload)
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
        const payload = {
            version: VERSION,
            state,
        }
        const result = validateAndPrepareAppStatePayload(payload)
        expect(result.state.backgroundLayer).toBeDefined()
    })

    it('accepts a state with null backgroundLayer', () => {
        const state: AppStateConfig = {
            ...validState,
            backgroundLayer: null,
        }

        const payload = {
            version: VERSION,
            state,
        }
        const result = validateAndPrepareAppStatePayload(payload)
        expect(result.state.backgroundLayer).toBeNull()
    })

    it('accepts a state with empty layers array', () => {
        const state: AppStateConfig = { ...validState, layers: [] }
        const payload = {
            version: VERSION,
            state,
        }
        const result = validateAndPrepareAppStatePayload(payload)
        expect(result.state.layers).toEqual([])
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
        const payload = {
            version: VERSION,
            state,
        }
        const result = validateAndPrepareAppStatePayload(payload)
        expect(result.state.layers[0].dimensions).toEqual({
            time: { currentValue: '2020' },
        })
    })

    it('rejects null input', () => {
        expect(() => validateAndPrepareAppStatePayload(null)).toThrow('must be a non-null object')
    })

    it('rejects non-object input', () => {
        expect(() => validateAndPrepareAppStatePayload('string')).toThrow(
            'must be a non-null object'
        )
    })

    it('rejects unsupported version', () => {
        expect(() =>
            validateAndPrepareAppStatePayload({ state: validState, version: '2' })
        ).toThrow(`The version 2 does not satisfy the constraint ${APP_STATE_CONFIG_CONSTRAINT}`)
    })

    it('rejects missing version', () => {
        expect(() =>
            validateAndPrepareAppStatePayload({
                state: { map: validState.map, layers: validState.layers },
            })
        ).toThrow('Mandatory key "version" not present in the payload')
    })

    it('rejects missing map', () => {
        expect(() =>
            validateAndPrepareAppStatePayload({
                version: '1.0',
                state: { layers: validState.layers },
            })
        ).toThrow('Mandatory key "map" not present in the state')
    })

    it('rejects invalid center', () => {
        expect(() =>
            validateAndPrepareAppStatePayload({
                version: VERSION,
                state: {
                    ...validState,
                    map: { ...validState.map, center: [1] },
                },
            })
        ).toThrow('Center should be an array of two numbers')
    })

    it('rejects negative zoom', () => {
        expect(() =>
            validateAndPrepareAppStatePayload({
                version: VERSION,
                state: {
                    ...validState,
                    map: { ...validState.map, zoom: -1 },
                },
            })
        ).toThrow('map.zoom must be a non-negative number')
    })

    it('rejects non-number rotation', () => {
        expect(() =>
            validateAndPrepareAppStatePayload({
                version: VERSION,
                state: {
                    ...validState,
                    map: { ...validState.map, rotation: 'abc' },
                },
            })
        ).toThrow('rotation attribute should be a number')
    })

    it('rejects missing layers', () => {
        expect(() =>
            validateAndPrepareAppStatePayload({ version: '1.0', state: { map: validState.map } })
        ).toThrow('Mandatory key "layers" not present in the state')
    })

    it('rejects layer with missing layerUrl', () => {
        expect(() =>
            validateAndPrepareAppStatePayload({
                version: VERSION,
                state: {
                    ...validState,
                    layers: [{ type: 'wms', isVisible: true, opacity: 1 }],
                },
            })
        ).toThrow('mandatory attribute layerUrl not present in layer state configuration')
    })

    it('rejects layer with opacity out of range', () => {
        const layerUrl = 'https://api.example.com/ogc/items/test'
        expect(() =>
            validateAndPrepareAppStatePayload({
                version: VERSION,
                state: {
                    ...validState,
                    layers: [
                        {
                            layerUrl,
                            type: 'wms',
                            isVisible: true,
                            opacity: 1.5,
                        },
                    ],
                },
            })
        ).toThrow(`${layerUrl} opacity must be a number between 0 and 1`)
    })

    it('rejects invalid backgroundLayer', () => {
        expect(() =>
            validateAndPrepareAppStatePayload({
                version: VERSION,
                state: {
                    ...validState,
                    backgroundLayer: { layerUrl: 'https://api.example.com/ogc/items/test' },
                },
            })
        ).toThrow('mandatory attribute type not present in layer state configuration')
    })
})
