import type { Lang } from '@/language'

/**
 * Serializable representation of a layer for state configuration.
 * Uses humanId (stable layer identifier) instead of uuid (runtime-generated).
 */
export interface LayerStateConfig {
    humanId: string
    type: string
    isVisible: boolean
    opacity: number
    zIndex: number
    datasetId?: string
    dimensions?: Partial<Record<string, { currentValue: string | null }>>
}

/**
 * JSON structure representing the full app state for sharing/shortlink.
 * Coordinates use WGS84 (EPSG:4326) [lon, lat] for interoperability.
 */
export interface AppStateConfig {
    version: 1
    map: {
        center: [number, number] // [lon, lat] in WGS84
        zoom: number
        rotation: number
    }
    layers: LayerStateConfig[]
    backgroundLayer?: LayerStateConfig | null
    lang?: Lang
}

/**
 * Validates and parses a JSON value into an AppStateConfig.
 * Throws descriptive errors on invalid input.
 */
export function parseAppState(json: unknown): AppStateConfig {
    if (typeof json !== 'object' || json === null) {
        throw new Error('State config must be a non-null object')
    }

    const obj = json as Record<string, unknown>

    if (obj.version !== 1) {
        throw new Error(`Unsupported state config version: ${String(obj.version)}`)
    }

    validateMap(obj.map)
    validateLayers(obj.layers)

    if (obj.backgroundLayer !== undefined && obj.backgroundLayer !== null) {
        validateLayerConfig(obj.backgroundLayer, 'backgroundLayer')
    }

    return json as AppStateConfig
}

function validateMap(map: unknown): asserts map is AppStateConfig['map'] {
    if (typeof map !== 'object' || map === null) {
        throw new Error('State config must include a "map" object')
    }

    const m = map as Record<string, unknown>

    if (
        !Array.isArray(m.center) ||
        m.center.length !== 2 ||
        typeof m.center[0] !== 'number' ||
        typeof m.center[1] !== 'number'
    ) {
        throw new Error('map.center must be a [lon, lat] number array')
    }

    if (typeof m.zoom !== 'number' || m.zoom < 0) {
        throw new Error('map.zoom must be a non-negative number')
    }

    if (typeof m.rotation !== 'number') {
        throw new Error('map.rotation must be a number')
    }
}

function validateLayers(layers: unknown): asserts layers is LayerStateConfig[] {
    if (!Array.isArray(layers)) {
        throw new Error('State config must include a "layers" array')
    }

    for (let i = 0; i < layers.length; i++) {
        validateLayerConfig(layers[i], `layers[${i}]`)
    }
}

function validateLayerConfig(layer: unknown, path: string): asserts layer is LayerStateConfig {
    if (typeof layer !== 'object' || layer === null) {
        throw new Error(`${path} must be a non-null object`)
    }

    const l = layer as Record<string, unknown>

    if (typeof l.humanId !== 'string') {
        throw new Error(`${path}.humanId must be a string`)
    }

    if (typeof l.type !== 'string') {
        throw new Error(`${path}.type must be a string`)
    }

    if (typeof l.isVisible !== 'boolean') {
        throw new Error(`${path}.isVisible must be a boolean`)
    }

    if (typeof l.opacity !== 'number' || l.opacity < 0 || l.opacity > 1) {
        throw new Error(`${path}.opacity must be a number between 0 and 1`)
    }

    if (typeof l.zIndex !== 'number') {
        throw new Error(`${path}.zIndex must be a number`)
    }
}
