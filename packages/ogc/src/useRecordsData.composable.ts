import type { GeoAdminGeoJSONStyleDefinition } from '@swissgeo/shared/geojson'
import type { AnyLayer, RasterLayer, Style } from 'mapbox-gl'

import { computed } from 'vue'

import type {
    Service,
    ServiceProtocol,
    Dataset,
    Distribution,
    DistributionCollection,
} from '../types'

import {
    extractDistribution,
    grabCapabilityUrl,
    grabDistributionLink,
    grabGeoJsonUrl,
    grabServiceUrl,
    grabStyleUrl,
} from './traveller'

const DEFAULT_OPACITY = 1

/**
 * Go through the tree of the OGC records and extract the necessary information to request a
 * capability
 *
 * Following the links of a OGC feature, we extract the entry called 'distributions'. This will lead
 * us to the specification of the layer, which contains the links to the service. The service itself
 * contains the URL to the capabilities, which we return for the concrete implementations to be
 * used
 *
 * Since these operations are a cascade of server requests, the ORDER OF THE ELEMENTS IN HERE
 * MATTERS
 */

/**
 * TODO not yet happy about this. It's not very robust I think, and it mixes stuff from geojson and
 * WMS/wmts
 *
 *     Trying to figure out a better way. The cool thing about this is that we can keep the reactivity.
 *     So if the dataset changes, this would trigger the re-loading of all the data, which could be nice
 *     Gotta test that with the language though. Could also be that it would override stuff that we don't want
 *     (e.g. the time dimension)
 */
export async function useRecordsData(dataset: Dataset, protocol: ServiceProtocol) {
    // Get the distribution
    const distributionLink = computed(() => grabDistributionLink(dataset))

    const distributionCollection = await $fetch<DistributionCollection>(distributionLink.value)

    const feature = computed(
        (): Distribution => extractDistribution(distributionCollection, protocol)
    )

    /** Extract the capabilities URL from the OGC Record */
    const serviceUrl = computed(() => grabServiceUrl(feature.value))

    // get the Service
    let serviceData: Service
    if (serviceUrl.value) {
        serviceData = await $fetch<Service>(serviceUrl.value)
    }

    const capabilityUrl = computed(() => grabCapabilityUrl(serviceData))

    const geoJsonUrl = computed(() => grabGeoJsonUrl(feature.value))

    /**
     * Retrieve the style file if there is one references
     *
     * @param feature
     * @returns
     */
    const styleDataUrl = computed((): string | null => grabStyleUrl(feature.value))

    let styleData: Style | GeoAdminGeoJSONStyleDefinition | null = null
    if (styleDataUrl.value) {
        styleData = await $fetch<Style | GeoAdminGeoJSONStyleDefinition>(styleDataUrl.value)
    }

    const defaultOpacityFromStyle = computed(() => {
        // maybe do something here like a check for the geojson layers?
        const isRasterLayer = (layer: AnyLayer): layer is RasterLayer => layer.type === 'raster'

        if (styleData && (styleData as Style).layers?.length) {
            // so far, we assume that the first and only entry is the correct one
            const layer = (styleData as Style).layers[0]

            if (!layer || !isRasterLayer(layer)) {
                return DEFAULT_OPACITY
            }

            const paint = layer.paint
            const rasterOpacity = paint?.['raster-opacity']
            if (rasterOpacity && typeof rasterOpacity === 'number') {
                return rasterOpacity
            }
        }
        return 1
    })

    return {
        serviceUrl,
        geoJsonUrl,
        styleData,
        capabilityUrl,
        defaultOpacityFromStyle,
    }
}
