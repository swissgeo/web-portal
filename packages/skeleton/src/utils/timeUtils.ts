import { isTimestampYYYYMMDD } from '@swissgeo/numbers'

// TODO move to shared
const ALL_YEARS_TIMESTAMP: string = 'all'

export function getDisplayNameFromTimestamp(timestamp: string) {
    if (timestamp === null) {
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
        let parsedYear: string | undefined
        // let month: string | undefined
        // let day: string | undefined
        if (isTimestampYYYYMMDD(timestamp)) {
            parsedYear = timestamp.substring(0, 4)
            // month = timestamp.substring(4, 6)
            // day = timestamp.substring(6, 8)
        } else {
            const date = new Date(timestamp)
            if (!isNaN(date.getFullYear())) {
                parsedYear = date.getFullYear().toString().padStart(4, '0')
            }
            // if (!isNaN(date.getMonth())) {
            //     // getMonth returns value between 0 and 11
            //     month = (date.getMonth() + 1).toString().padStart(2, '0')
            // }
            // if (!isNaN(date.getDate())) {
            //     day = date.getDate().toString().padStart(2, '0')
        }
        // TODO with the current implementation I don't see how interval is really used...
        // if (parsedYear !== undefined && month !== undefined && day !== undefined) {
        //     interval = Interval.fromISO(`${parsedYear}-${month}-${day}/P1D`)
        // } else if (parsedYear !== undefined && month !== undefined) {
        //     interval = Interval.fromISO(`${parsedYear}-${month}-01/P1M`)
        // } else if (parsedYear !== undefined) {
        //     interval = Interval.fromISO(`${parsedYear}-01-01/P1Y`)
        // }
        if (parsedYear) {
            return parseInt(parsedYear)
        }
    }

    return 'unknown'
}
