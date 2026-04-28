/**
 * Serializable representation of a layer for state configuration.
 * Uses datasetUrl to re-fetch the full dataset on import.
 */
export interface LayerStateConfig {
    layerUrl?: string
    type: string
    isVisible: boolean
    opacity: number
    dimensions?: Record<string, { currentValue: string | null }>
}

/**
 * JSON structure representing the full app state for sharing/shortlink.
 * Coordinates use LV95 (EPSG:2056) [x, y].
 */
export interface AppStateConfig {
    map: {
        center: [number, number] // [x, y] in LV95 (EPSG:2056)
        zoom: number
        rotation: number
    }
    layers: LayerStateConfig[]
    backgroundLayer?: LayerStateConfig | null,
}

export interface AppStatePayload {
    version: string
    state: AppStateConfig
}

// used only internally in validation. They are kept here to be easy to modify when we modify the interface.
export const layerStateConfigKeys = ['layerUrl', 'type', 'isVisible', 'opacity', 'dimensions']
export const validAppStateConfigKeys = ['map', 'layers', 'backgroundLayer']
export const validateAppStatePayloadKeys = ['version', 'state']
