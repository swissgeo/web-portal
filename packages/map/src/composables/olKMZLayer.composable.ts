import log from '@swissgeo/log'
import KML from 'ol/format/KML'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'

import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'

export default function useOlKMZLayer(
    layerId: string,
    uuid: string,
    kmzDataBase64: string,
    opacity: number,
    zIndex: number
) {
    const layer = new VectorLayer({
        properties: {
            id: layerId,
            uuid,
        },
        opacity,
    })

    async function initialize(): Promise<void> {
        log.debug(`Initializing KMZ layer ${layerId}`)

        try {
            // Decode base64 to binary
            const binaryString = atob(kmzDataBase64)
            const uint8Array = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
                uint8Array[i] = binaryString.charCodeAt(i)
            }

            // Extract KML from KMZ
            const { unzip } = await import('fflate')

            const unzipped = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
                unzip(uint8Array, (err: Error | null, data: Record<string, Uint8Array>) => {
                    if (err) {
                        reject(new Error(err.message))
                    } else {
                        resolve(data)
                    }
                })
            })

            // Find the first .kml file in the archive
            const decoder = new TextDecoder('utf-8')
            let kmlContent = ''

            for (const [filename, content] of Object.entries(unzipped)) {
                if (filename.toLowerCase().endsWith('.kml')) {
                    kmlContent = decoder.decode(content)
                    break
                }
            }

            if (!kmlContent) {
                throw new Error('No KML file found in KMZ archive')
            }

            // Parse KML content
            const format = new KML({
                extractStyles: true,
                showPointNames: false,
            })

            const features = format.readFeatures(kmlContent, {
                featureProjection: 'EPSG:3857', // Web Mercator
            })

            const source = new VectorSource({
                features,
            })

            layer.setSource(source)
            log.debug(`KMZ layer ${layerId} initialized with ${features.length} features`)
        } catch (error) {
            log.error({
                title: 'useOlKMZLayer',
                messages: [`Failed to initialize KMZ layer ${layerId}`, error],
            })
            throw error
        }
    }

    const { setVisibility, setZIndex } = useAddLayerToMap(layer, zIndex)

    return { initialize, setVisibility, setZIndex }
}
