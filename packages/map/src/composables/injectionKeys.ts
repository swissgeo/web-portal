import type { InjectionKey } from 'vue'

/**
 * Resolves a what3words address for a given WGS84 coordinate.
 * Provided by the host application so that the map package remains
 * decoupled from any specific API route or API key.
 *
 * @param lat - Latitude in WGS84
 * @param lon - Longitude in WGS84
 * @returns The what3words address string (e.g. "filled.count.soap")
 */
export const W3W_RESOLVER_KEY: InjectionKey<(lat: number, lon: number) => Promise<string>> =
    Symbol('w3wResolver')
