import { isTimestampYYYYMMDD } from '@swissgeo/numbers'

import { ALL_YEARS_TIMESTAMP } from '@/globals'

/**
 * Extracts the year (as a 4-character string) from a geoadmin timestamp value.
 * Handles formats: 'YYYY', 'YYYYMMDD', 'YYYY-MM-DD', ISO 8601, etc.
 * Returns undefined if the timestamp cannot be parsed.
 */
export function getYearFromGeoadminValue(timestamp: string): string | undefined {
    if (timestamp.match(/^\d{4}$/)) {
        return timestamp
    }

    if (isTimestampYYYYMMDD(timestamp)) {
        return timestamp.substring(0, 4)
    }

    const date = new Date(timestamp)
    if (!isNaN(date.getFullYear())) {
        const parsedYear = date.getFullYear().toString().padStart(4, '0')
        if (parsedYear) {
            return parsedYear
        }
    }

    return undefined
}

export function getDisplayNameFromTimestamp(timestamp: string | null | undefined) {
    if (timestamp === null || timestamp === undefined) {
        return '-'
    } else if (timestamp === 'current') {
        return 'current'
    } else if (timestamp.startsWith('9999') || timestamp === ALL_YEARS_TIMESTAMP) {
        // there's a difference between WMS and WMTS:
        // WMS will store 'all' as timestamp. If 'all' is set, then it won't give the
        // server a time
        // However on wmts we'll specifically select the timestamp that represents
        // all in the requests
        return ALL_YEARS_TIMESTAMP
    } else {
        const parsedYear = getYearFromGeoadminValue(timestamp)
        if (parsedYear) {
            return parseInt(parsedYear)
        }
    }

    return 'unknown'
}
