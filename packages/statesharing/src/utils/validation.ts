import { EPSG_2056_BOUNDING_BOX } from '@swissgeo/shared'
import semver from 'semver'

import type { AppStateConfig, AppStatePayload, LayerStateConfig } from '@/types/types'

import { APP_STATE_CONFIG_CONSTRAINT } from '@/constants'
import {
    layerStateConfigKeys,
    validAppStateConfigKeys,
    validateAppStatePayloadKeys,
} from '@/types/types'

export function isInstanceOfLayerStateConfig(object: unknown): object is LayerStateConfig {
    const maybeLayerState = object as LayerStateConfig

    if (!maybeLayerState || typeof maybeLayerState !== 'object') {
        throw new Error('Layer configuration should be an object')
    }

    Object.keys(maybeLayerState).forEach((key) => {
        if (!layerStateConfigKeys.includes(key)) {
            throw new Error(`The following key ${key} is not allowed in layers state configuration`)
        }
    })

    if (!('layerUrl' in maybeLayerState)) {
        throw new Error('mandatory attribute layerUrl not present in layer state configuration')
    }

    if (!('type' in maybeLayerState)) {
        throw new Error('mandatory attribute type not present in layer state configuration')
    }
    if (!('isVisible' in maybeLayerState)) {
        throw new Error('mandatory attribute isVisible not present in layer state configuration')
    }
    if (!('opacity' in maybeLayerState)) {
        throw new Error('mandatory attribute opacity not present in layer state configuration')
    }

    if (typeof maybeLayerState.layerUrl !== 'string') {
        throw new Error('datasetUrl attribute should be a string')
    }
    if (typeof maybeLayerState.type !== 'string') {
        throw new Error('type attribute should be a string')
    }
    if (typeof maybeLayerState.isVisible !== 'boolean') {
        throw new Error('isVisible attribute should be a boolean')
    }
    if (typeof maybeLayerState.opacity !== 'number') {
        throw new Error('opacity attribute should be a number')
    }
    if (
        maybeLayerState.dimensions !== undefined &&
        typeof maybeLayerState.dimensions !== 'object'
    ) {
        throw new Error('dimensions attribute should be an object')
    }
    return true
}

/**
 *
 * @param object the object we would like to know if they're an instance of AppStateConfig
 * @throws {Error} when an attribute is not present or of the wrong type
 * @returns {boolean} wether the given object is an instance of an App State Config
 */
export function isInstanceOfAppStateConfig(object: unknown): object is AppStateConfig {
    const maybeAppState = object as AppStateConfig

    if (!maybeAppState || typeof maybeAppState !== 'object') {
        throw new Error('App state should be a JSON object')
    }

    Object.keys(maybeAppState).forEach((key) => {
        if (!validAppStateConfigKeys.includes(key)) {
            throw new Error(`The following key is not a valid app State key : ${key}`)
        }
    })

    if (!('map' in maybeAppState)) {
        throw new Error('Mandatory key "map" not present in the state')
    }
    if (!('layers' in maybeAppState)) {
        throw new Error('Mandatory key "layers" not present in the state')
    }

    if (typeof maybeAppState.map !== 'object') {
        throw new Error('Version should be a Object')
    }
    if (!Array.isArray(maybeAppState.layers)) {
        throw new Error('Version should be an array')
    }

    if (
        maybeAppState.layers.filter((layerStateConfig) =>
            isInstanceOfLayerStateConfig(layerStateConfig)
        ).length !== maybeAppState.layers.length
    ) {
        throw new Error('All layers states configurations should be valid')
    }

    if (!('zoom' in maybeAppState.map)) {
        throw new Error('Mandatory key "zoom" not present in the state map')
    }
    if (!('rotation' in maybeAppState.map)) {
        throw new Error('Mandatory key "rotation" not present in the state map')
    }
    if (!('center' in maybeAppState.map)) {
        throw new Error('Mandatory key "center" not present in the state map')
    }
    if (typeof maybeAppState.map.zoom !== 'number') {
        throw new Error('zoom attribute should be a number')
    }
    if (typeof maybeAppState.map.rotation !== 'number') {
        throw new Error('rotation attribute should be a number')
    }
    if (
        !Array.isArray(maybeAppState.map.center) ||
        maybeAppState.map.center.length !== 2 ||
        maybeAppState.map.center.filter((coordinate) => typeof coordinate === 'number').length !== 2
    ) {
        throw new Error('Center should be an array of two numbers')
    }
    if (maybeAppState.backgroundLayer !== undefined && maybeAppState.backgroundLayer !== null) {
        if (!isInstanceOfLayerStateConfig(maybeAppState.backgroundLayer)) {
            throw new Error(
                'Background layer state configuration should be valid, or background layer should be nullish'
            )
        }
    }

    return true
}

function isInstanceOfAppStatePayload(object: unknown): object is AppStatePayload {
    const maybeAppPayload = object as AppStatePayload

    if (!maybeAppPayload || typeof maybeAppPayload !== 'object') {
        throw new Error('App state should be a JSON object')
    }

    Object.keys(maybeAppPayload).forEach((key) => {
        if (!validateAppStatePayloadKeys.includes(key)) {
            throw new Error(`The following key is not a valid app State key : ${key}`)
        }
    })

    if (!('version' in maybeAppPayload)) {
        throw new Error('Mandatory key "version" not present in the payload')
    }

    if (typeof maybeAppPayload.version !== 'string') {
        throw new Error('Version should be a string')
    }

    return true
}

/**
 * Ensure the given object is a valid AppStateConfig.
 *
 * @param json an object that might be an AppStateConfig
 * @throws {Error} with a descriptive message when an error is met
 * @returns the initial object if it passes the validation
 */
export function validateAppState(json: unknown): AppStateConfig {
    if (typeof json !== 'object' || json === null) {
        throw new Error('State config must be a non-null object')
    }

    // this makes a check on the object to ensure all types are as expected.
    if (!isInstanceOfAppStateConfig(json)) {
        throw new Error('State config is not conform')
    }

    validateMap(json.map)
    json.layers.forEach((layer) => validateLayerConfig(layer))

    if (json.backgroundLayer !== undefined && json.backgroundLayer !== null) {
        validateLayerConfig(json.backgroundLayer)
        // currently, nothing stops someone to change the background opacity, so we force it to 1
    }

    return json
}

export function validateAppStatePayload(json: unknown): AppStatePayload {
    if (typeof json !== 'object' || json === null) {
        throw new Error('State payload must be a non-null object')
    }

    // this makes a check on the object to ensure all types are as expected.
    if (!isInstanceOfAppStatePayload(json)) {
        throw new Error('State payload is not conform')
    }

    const version = semver.coerce(json.version)
    if (!version || !semver.satisfies(version, APP_STATE_CONFIG_CONSTRAINT)) {
        throw new Error(
            `The version ${json.version} does not satisfy the constraint ${APP_STATE_CONFIG_CONSTRAINT}`
        )
    }

    validateAppState(json.state)

    return json
}

// The types verifications are already made with the isInstanceOfAppStateConfig and isInstanceOfLayerStateConfig methods,
// so we only validate the data itself.
function validateMap(map: AppStateConfig['map']): asserts map is AppStateConfig['map'] {
    if (
        map.center[0] < EPSG_2056_BOUNDING_BOX[0] ||
        map.center[0] > EPSG_2056_BOUNDING_BOX[2] ||
        map.center[1] < EPSG_2056_BOUNDING_BOX[1] ||
        map.center[1] > EPSG_2056_BOUNDING_BOX[3]
    ) {
        throw new Error('map.center must be a [x, y] number array within LV95 bounds')
    }

    if (map.zoom < 0) {
        throw new Error('map.zoom must be a non-negative number')
    }
}

function validateLayerConfig(layer: LayerStateConfig): asserts layer is LayerStateConfig {
    if (layer.opacity < 0 || layer.opacity > 1) {
        throw new Error(`${layer.layerUrl} opacity must be a number between 0 and 1`)
    }
}
