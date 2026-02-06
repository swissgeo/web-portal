import type { Dimension, Layer } from '@swissgeo/layers'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import { isTimestampYYYYMMDD } from '@swissgeo/numbers'
import { ALL_YEARS_TIMESTAMP, CURRENT_YEAR_TIMESTAMP } from '@swissgeo/shared'

export type LayerWithTime = Layer & { dimensions: { time: Dimension } }

/**
 * Create two sets with values that occur in the layers with timestamps
 *
 * `yearsJoint` contains the values that are shared in all the layers `yearsSepearate` contains the
 * values that are exclusive to some layers
 */
export function getYearsWithData(layersWithTimestamps: LayerWithTime[]) {
    const timeConfigs = layersWithTimestamps.map((layer) => layer.dimensions.time)

    if (timeConfigs.length === 0) {
        return {
            yearsJoint: [],
            yearsSeparate: [],
        }
    }

    const yearCounter: Record<string, number> = {}

    for (const timeConfig of timeConfigs) {
        for (const timestamp of timeConfig.availableValues) {
            if (
                timestamp === ALL_YEARS_TIMESTAMP ||
                timestamp === CURRENT_YEAR_TIMESTAMP ||
                timestamp.startsWith('9999')
            ) {
                // we don't want these for the timeslider
                continue
            }

            const year = getYearFromCustomGeoadminValue(timestamp)
            if (!year) {
                continue
            }

            if (year in yearCounter && yearCounter[year]) {
                yearCounter[year]++
            } else {
                yearCounter[year] = 1
            }
        }
    }

    const yearsJoint = Object.entries(yearCounter)
        .filter(([_, count]) => {
            return count === timeConfigs.length // this year is in every time config
        })
        .map(([year, _]) => parseInt(year))
        .sort()

    const yearsSeparate = Object.entries(yearCounter)
        .filter(([_, count]) => {
            return count !== timeConfigs.length // this year is NOT in every time config
        })
        .map(([year, _]) => parseInt(year))
        .sort()

    return {
        yearsJoint,
        yearsSeparate,
    }
}

export function getYearFromCustomGeoadminValue(timestamp: string): string | undefined {
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

    log.error({
        title: 'Time Slider Utils',
        titleColor: LogPreDefinedColor.Emerald,
        messages: ['Unable to parse the timestamp', timestamp],
    })
    return undefined
}

export function convertYearToTimestamp(layer: LayerWithTime, year: number) {
    const availableValues = layer.dimensions.time.availableValues
    if (availableValues.includes(year.toString())) {
        return year.toString()
    }

    // We're probably dealing with a WMTS layer. We now need to convert this
    // year back to something that can be used on this layer!

    for (const timestamp of availableValues) {
        const valueInYear = getYearFromCustomGeoadminValue(timestamp)
        if (year.toString() === valueInYear) {
            return timestamp
        }
    }
    return null
}
