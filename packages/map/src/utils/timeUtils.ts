import { ALL_YEARS_TIMESTAMP } from '@swissgeo/shared'

type TimeInfo = { availableTimes: string[] | null; defaultTime: string | null }

export const getTimeInfoFromWMTSCapabilities = (dimensions: any): TimeInfo => {
    // Guard against missing or invalid dimensions
    if (!Array.isArray(dimensions) || dimensions.length === 0) {
        return { availableTimes: null, defaultTime: null }
    }

    // TODO only take it if it's time
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
export const getTimeInfoFromWMSCapabilities = (dimensions: any): TimeInfo => {
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

    if (values.match(/\d+\/\d+/)) {
        // the time is of the format 2011/2023
        const [start, end] = values.split('/').map((val) => parseInt(val))
        // construct an array with the length of the parsed values then map the years
        // inbetween and convert it finally to string
        availableTimes = Array.from({ length: end - start + 1 }, (v, k) => k + start).map((time) =>
            time.toString()
        )
    } else if (values.match(/(?:\d+,)+\d+/)) {
        // values are a comma separated list
        const singleValues = values.split(',').map((val) => parseInt(val).toString())
        availableTimes = singleValues
    }

    if (availableTimes.length) {
        availableTimes.push(ALL_YEARS_TIMESTAMP)
    }

    if (!defaultTime && availableTimes.length > 0) {
        // no default time, use the last in the array
        defaultTime = availableTimes[availableTimes.length - 1]
    }
    return { availableTimes, defaultTime }
}
