declare global {
    interface Window {
        map: OlMap
    }
}

const swissgeoOlMap = window.swissgeoOlMap || {}

declare module 'reproject' {
    import type { Geometry, FeatureCollection, GeoJsonProperties } from 'geojson'

    export function reproject(
        input: FeatureCollection<Geometry, GeoJsonProperties>,
        from: string,
        to: string,
        projs?: Record<string, string>
    ): FeatureCollection<Geometry, GeoJsonProperties>

    export function reproject(
        input: Geometry,
        from: string,
        to: string,
        projs?: Record<string, string>
    ): Geometry
}
