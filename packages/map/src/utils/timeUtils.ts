/** Timestamp to describe "all data" for time enabled WMS layer */
export const ALL_YEARS_TIMESTAMP: string = 'all'
/**
 * Timestamp to describe "current" or latest available data for a time enabled WMTS layer (and also
 * is the default value to give any WMTS layer that is not time enabled, as this timestamp is
 * required in the URL scheme)
 */
export const CURRENT_YEAR_TIMESTAMP: string = 'current'
// TODO move this to shared?

export const getTimeInfoFromWMTSCapabilities = (dimensions: any) => {
    // TODO only take it if it's time
    // TODO handle 9999
    const timeDimension = dimensions[0]
    const availableTimes = timeDimension.Value || ['current']

    const defaultTime = timeDimension.Default

    return {
        defaultTime,
        availableTimes,
    }
}
