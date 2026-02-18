import type { WMSDimension, WMTSDimension } from '@/openlayers/types'

/** Timestamp to describe "all data" for time enabled WMS layer */
export const ALL_YEARS_TIMESTAMP: string = 'all'
/**
 * Timestamp to describe "current" or latest available data for a time enabled WMTS layer (and also
 * is the default value to give any WMTS layer that is not time enabled, as this timestamp is
 * required in the URL scheme)
 */
export const CURRENT_YEAR_TIMESTAMP: string = 'current'
// TODO move this to shared?

type TimeInfo = { availableTimes: string[] | null; defaultTime: string | null }

export const getTimeInfoFromWMTSCapabilities = (dimensions: WMTSDimension[]): TimeInfo => {
    // Guard against missing or invalid dimensions
    if (!Array.isArray(dimensions) || dimensions.length === 0) {
        return { availableTimes: null, defaultTime: null }
    }

    // TODO only take it if it's time
    // TODO handle 9999
    const timeDimension = dimensions[0]
    if (!timeDimension) {
        return { availableTimes: null, defaultTime: null }
    }

    const availableTimes = timeDimension.Value || ['current']
    const defaultTime = timeDimension.Default

    return {
        defaultTime,
        availableTimes,
    }
}

/** @param dimensions Dimensions of the WMS capabilities */

export const getTimeInfoFromWMSCapabilities = (dimensions: WMSDimension[]): TimeInfo => {
    const getTimeDimension = () => {
        if (!dimensions) {
            return null
        }
        for (const dimension of dimensions) {
            if (dimension.name.toLowerCase() === 'time') {
                return dimension
            }
        }
    }
    const timeDimension = getTimeDimension()
    if (!timeDimension) {
        return { availableTimes: null, defaultTime: null }
    }

    const values = timeDimension.values

    let defaultTime = timeDimension.default
    let availableTimes: string[] = []

    if (values?.match(/\d+\/\d+/)) {
        // the time is of the format 2011/2023
        const [start, end] = values.split('/').map((val: string) => parseInt(val))
        // construct an array with the length of the parsed values then map the years
        // inbetween and convert it finally to string
        if (start && end && end > start) {
            availableTimes = Array.from({ length: end - start + 1 }, (v, k) => k + start).map(
                (time) => time.toString()
            )
        }
    } else if (values?.match(/(?:\d+,)+\d+/)) {
        // values are a comma separated list
        const singleValues = values.split(',').map((val: string) => parseInt(val).toString())
        availableTimes = singleValues
    }

    if (availableTimes.length) {
        availableTimes.push(ALL_YEARS_TIMESTAMP)
    }

    if (!defaultTime && availableTimes.length > 0) {
        // no default time, use the last in the array
        defaultTime = availableTimes[availableTimes.length - 1]
    }
    return { availableTimes, defaultTime: defaultTime || null }
}
