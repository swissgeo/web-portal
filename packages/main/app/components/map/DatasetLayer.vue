<script setup lang="ts">
/**
 * Dataset Layer Converter Container
 *
 * This is a sort of container component that is used to trigger the data fetching
 * from the OGC records.
 * This code maps the data from the layer store to the data structure needed by the
 * map module. The intermediate conversion is basically the traversal of the OGC dataset that
 * is being provided.
 */
import type { DatasetLayer, Dimension } from '@swissgeo/layers'
import type { Layer as MapLayer, LayerType } from '@swissgeo/map'
import type { Distribution } from '@swissgeo/ogc'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import {
    usePreferredDistribution,
    useDistribution,
    useDistributionCollection,
    useService,
    useWmtsCapabilities,
    useWmsCapabilities,
    useGeoJson,
} from '@swissgeo/ogc'
import { getTimeInfoFromWMTSCapabilities } from '~/utils/timeUtils'

const emit = defineEmits<{
    update: [layer: MapLayer]
    updateTimeDimension: [layerUuid: string, dimension: Partial<Dimension>]
    remove: [void]
}>()

const { layer, zIndex } = defineProps<{
    layer: DatasetLayer
    zIndex: number
}>()
const { locale } = useI18n()

// holds the data that's specific for the layers
const layerSpecificData = ref()

const { distributionCollection } = useDistributionCollection(ref(layer.dataset))
const { preferredDistributionId } = usePreferredDistribution(ref(layer.dataset))

// if there's a preferred distribution, let's get that one, otherwise the first one
const distributionId = computed(() => {
    if (!distributionCollection.value) {
        return null
    }
    if (preferredDistributionId.value) {
        return preferredDistributionId.value
    } else if (distributionCollection && distributionCollection.value.records.length) {
        return distributionCollection.value.records[0]!.id
    }
    return null
})

const { distribution, layerId } = useDistribution(distributionCollection, distributionId)
const { serviceData } = useService(distribution)

const layerType = computed(() => determineLayerType(distribution))
const layerZIndex = computed(() => zIndex)

/**
 * Reactively merge the data from the store as well as the
 * data from the OGC records
 */
const layerData = computed((): MapLayer => {
    return {
        layerId: layerId.value,
        type: layerType.value,
        ...layerSpecificData.value,

        uuid: layer.uuid,

        // some data we pass directly from the original, so when it's updated
        // the change will be reflected in the data that the map receives
        dimensions: layer.dimensions,
        isVisible: layer.isVisible,
        opacity: layer.opacity,
        zIndex: layerZIndex.value,
    }
})

/**
 * Since we need to decide based on the layer type what to do next, we wrap this
 * here in a watch. Otherwise we could probably do it reactively as the rest
 */
watch(
    () => serviceData.value,
    () => {
        if (layerType.value === 'WMTS') {
            getWmtsSpecificData()
        } else if (layerType.value === 'WMS') {
            getWmsSpecificData()
        }
    }
)

/**
 * If we're dealing with a geoJSON, then this watcher needs triggering,
 * as we don't have the serviceData there
 */
watch(
    () => distribution.value,
    () => {
        if (layerType.value === 'GeoJSON') {
            getGeoJSONSpecificData()
        }
    }
)

watch(
    () => layerData.value,
    () => emit('update', layerData.value)
)

onBeforeUnmount(() => {
    emit('remove')
})

function determineLayerType(distribution: Ref<Distribution | null>): LayerType {
    if (!distribution || !distribution.value || !distribution.value.properties) {
        return null
    }

    const protocol = distribution.value.properties.protocol

    switch (protocol) {
        case 'OGC:WMTS':
            return 'WMTS'
        case 'OGC:WMS':
            return 'WMS'
        case 'OGC:GeoJSON':
            return 'GeoJSON'
    }

    return null
}

/**
 * Get the WMTS specific data
 * Specifically, parse the capabilities and update the time info
 */
function getWmtsSpecificData() {
    const { wmtsData } = useWmtsCapabilities(serviceData, layerId)

    const options = computed(() => wmtsData.value?.options || null)
    const dimensions = computed(() => wmtsData.value?.dimensions || null)

    const timeInfo = computed(() => getTimeInfoFromWMTSCapabilities(dimensions.value))

    watch(timeInfo, () => {
        processTimeInfo(timeInfo)
    })

    watch(
        () => options.value,
        () => {
            layerSpecificData.value = {
                options: options.value,
            }
        },
        { immediate: true }
    )
}

/**
 * Get data specific to WMS
 */
function getWmsSpecificData() {
    const { wmsData } = useWmsCapabilities(serviceData, layerId)
    const dimensions = computed(() => wmsData.value?.dimensions || null)
    const timeInfo = computed(() => getTimeInfoFromWMSCapabilities(dimensions.value))

    const capabilities = computed(() => wmsData?.value?.capabilities)
    const currentLang = computed(() => locale.value.toLowerCase())

    const url = computed(() => capabilities.value?.Service.OnlineResource)
    const version = computed(() => capabilities.value?.version)

    processTimeInfo(timeInfo)

    watch(
        () => wmsData.value,
        () => {
            layerSpecificData.value = {
                url,
                gutter: 0,
                version,
                lang: currentLang.value,
            }
        }
    )

    watch(currentLang, () => {
        if (layerSpecificData.value) {
            layerSpecificData.value = {
                ...layerSpecificData.value,
                lang: currentLang.value,
            }
        }
    })
}

function getGeoJSONSpecificData() {
    const { geoJsonData } = useGeoJson(distribution)

    watch(
        () => geoJsonData.value,
        () => {
            layerSpecificData.value = {
                geoJsonData: geoJsonData.value.geoJsonData,
                geoJsonStyle: geoJsonData.value.geoJsonStyle,
            }
        }
    )
}

/**
 * Process the dimensions and turn the into a time info that is being passed to the layer store
 */
function processTimeInfo(timeInfo: Ref<TimeInfo>) {
    watch(
        timeInfo,
        () => {
            if (layer.dimensions?.time?.currentValue) {
                // if the dimension is already there and has a value, we don't touch it anymore
                return
            }
            const { defaultTime, availableTimes } = timeInfo.value

            const dimension: Partial<Dimension> = {}

            if (defaultTime) {
                dimension.currentValue = defaultTime
            }
            if (availableTimes) {
                dimension.availableValues = availableTimes
            }
            log.debug({
                title: 'DatasetLayer',
                titleColor: LogPreDefinedColor.Yellow,
                messages: ['Sending update of dimensions from the capabilities', timeInfo.value],
            })
            emit('updateTimeDimension', layer.uuid, dimension)
        },
        { immediate: true }
    )
}
</script>

<template><slot></slot></template>
