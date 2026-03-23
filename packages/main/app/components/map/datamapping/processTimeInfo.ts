import type { Dimension } from '@swissgeo/layers'

import log, { LogPreDefinedColor } from '@swissgeo/log'

/**
 * Process the dimensions and turn the into a time info that is being passed to the layer store
 */
export function processTimeInfo(timeInfo: Ref<TimeInfo>) {
    // if (layer.dimensions?.time?.currentValue) {
    //     // if the dimension is already there and has a value, we don't touch it anymore
    //     return
    // }
    const { defaultTime, availableTimes } = timeInfo.value

    const dimension: Partial<Dimension> = {}

    if (defaultTime) {
        dimension.currentValue = defaultTime
    }
    if (availableTimes) {
        dimension.availableValues = availableTimes
    }
    log.debug({
        title: 'WmtsLayer',
        titleColor: LogPreDefinedColor.Yellow,
        messages: ['Sending update of dimensions from the capabilities', timeInfo.value],
    })
    return dimension
}
