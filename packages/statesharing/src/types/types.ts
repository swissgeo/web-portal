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

export const printFormats = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5'] as const
export type PrintFormat = typeof printFormats[number];
export const printOrientations = ['landscape', 'portrait'] as const
export type PrintOrientation = typeof printOrientations[number]

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

export interface PrintConfig {
    /**
     * Format of the print output
     */
    format: PrintFormat;
    /**
     * Resolution of the print in dip per inch, DPI (eg. 96)
     */
    resolution: number;
    /**
     * Orientation of the print, landscape being horizonal, portrait being vertical
     */
    orientation: PrintOrientation;
    /**
     * Scale of the print in meter per meter (eg. 25000)
     */
    scale: number;
}

export interface AppStatePayload {
    version: string
    state: AppStateConfig
}

// used only internally in validation. They are kept here to be easy to modify when we modify the interface.
export const layerStateConfigKeys = ['layerUrl', 'type', 'isVisible', 'opacity', 'dimensions']
export const validAppStateConfigKeys = ['map', 'layers', 'backgroundLayer']
export const validateAppStatePayloadKeys = ['version', 'state', 'app']
