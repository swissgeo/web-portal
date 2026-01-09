import type { LayerData } from '@swissgeo/shared/api'
import type { Protocol } from '@swissgeo/shared/ogc'

export default async function useLayerData(layerId: string, protocol: Protocol) {
    const { data: layerData } = await useFetch<LayerData>(
        `/api/v1/layers/${layerId}?protocol=${protocol}`
    )

    const capabilityUrl = computed(() => {
        if (!layerData.value?.capabilityLink) {
            throw new Error('Unable to find CapabilityLink in layerData')
        }

        const link = layerData.value?.capabilityLink

        if ('href' in link) {
            return encodeURIComponent(link.href)
        } else if ('uriTemplate' in link) {
            return encodeURIComponent(link.uriTemplate.replace('{EPSG}', '2056'))
        }

        throw new Error(`Unable to read link from ${JSON.stringify(layerData.value)}`)
    })

    return { capabilityUrl }
}
