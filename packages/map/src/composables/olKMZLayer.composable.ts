import log from '@swissgeo/log'
import { unzip } from 'fflate'
import KML from 'ol/format/KML'
import VectorLayer from 'ol/layer/Vector'
import { register } from 'ol/proj/proj4'
import VectorSource from 'ol/source/Vector'
import proj4 from 'proj4'

import { EPSG_4326_WGS84 } from '@/composables/types.d'
import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'
import usePositionStore from '@/stores/position'

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
        const positionStore = usePositionStore()

        try {
            // Decode base64 to binary
            const binaryString = atob(kmzDataBase64)
            const uint8Array = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
                uint8Array[i] = binaryString.charCodeAt(i)
            }

            const unzipped = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
                unzip(uint8Array, (err: Error | null, data: Record<string, Uint8Array>) => {
                    if (err) {
                        reject(new Error(err.message))
                    } else {
                        resolve(data)
                    }
                })
            })

            // Find the first .kml file in the archive and extract icons
            const decoder = new TextDecoder('utf-8')
            let kmlContent = ''
            const iconFiles: Record<string, Blob> = {}


            for (const [filename, content] of Object.entries(unzipped)) {
                if (filename.toLowerCase().endsWith('.kml')) {
                    kmlContent = decoder.decode(content)
                } else if (filename.startsWith('icons/')) {
                    // Store icon files as blobs for use in styles
                    const blob = new Blob([content], {
                        type: filename.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
                    })
                    iconFiles[filename] = blob
                }
            }

            if (!kmlContent) {
                throw new Error('No KML file found in KMZ archive')
            }

            // Replace local icon references with blob URLs in KML content
            let modifiedKML = kmlContent
            for (const [filename, blob] of Object.entries(iconFiles)) {
                const blobUrl = URL.createObjectURL(blob)
                // Replace references to the icon file with the blob URL
                modifiedKML = modifiedKML.split(filename).join(blobUrl)
            }

            // Parse KML content
            const format = new KML({
                extractStyles: true,
                // showPointNames: false,
            })
            register(proj4)

            const features = format.readFeatures(modifiedKML, {
                featureProjection: positionStore.projection.epsg, // CH1903+ / LV95 / EPSG:2056
                dataProjection: EPSG_4326_WGS84, // WGS84
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
