import type { Map } from 'ol'
import type { FeatureLike } from 'ol/Feature'
import type Feature from 'ol/Feature'
import type { Ref } from 'vue'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import { createTextFeatureStyle, EPSG_4326_WGS84 } from '@swissgeo/shared'
import { unzip } from 'fflate'
import KML from 'ol/format/KML'
import VectorLayer from 'ol/layer/Vector'
import { register } from 'ol/proj/proj4'
import VectorSource from 'ol/source/Vector'
import proj4 from 'proj4'
import { computed, ref, watch } from 'vue'

import type { KMZLayer } from '@/types'

import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'
import usePositionStore from '@/stores/position'

export default function useOlKMZLayer(
    layer: Ref<KMZLayer>,
    olMap: Ref<Map | undefined> | undefined
) {
    const layerId = computed(() => layer.value.layerId)
    const zIndex = computed(() => layer.value.zIndex)
    const isVisible = computed(() => layer.value.isVisible)
    const opacity = computed(() => layer.value.opacity)
    const kmzDataBase64 = computed(() => layer.value.fileData)

    const olLayer = ref<VectorLayer>()

    watch(
        () => kmzDataBase64.value,
        () => {
            olLayer.value = new VectorLayer({
                properties: {
                    id: layerId,
                    uuid: layer.value.uuid,
                },
                opacity: opacity.value,
            })

            void initialize()
        },
        { immediate: true }
    )

    async function unzippKMZ(): Promise<Record<string, Uint8Array<ArrayBufferLike>>> {
        // Decode base64 to binary
        const binaryString = atob(kmzDataBase64.value)
        const uint8Array = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
            uint8Array[i] = binaryString.charCodeAt(i)
        }

        return await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
            unzip(uint8Array, (err: Error | null, data: Record<string, Uint8Array>) => {
                if (err) {
                    reject(new Error(err.message))
                } else {
                    resolve(data)
                }
            })
        })
    }

    function extractKMLAndIcons(unzipped: Record<string, Uint8Array>): {
        kmlContent: string
        iconFiles: Record<string, Blob>
    } {
        const decoder = new TextDecoder('utf-8')
        let kmlContent = ''
        const iconFiles: Record<string, Blob> = {}

        for (const [filename, content] of Object.entries(unzipped)) {
            if (filename.toLowerCase().endsWith('.kml')) {
                kmlContent = decoder.decode(content)
            } else if (filename.startsWith('icons/')) {
                const blob = new Blob([content as BlobPart], {
                    type: filename.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
                })
                iconFiles[filename] = blob
            }
        }

        if (!kmlContent) {
            throw new Error('No KML file found in KMZ archive')
        }

        return { kmlContent, iconFiles }
    }

    function replaceIconReferences(kmlContent: string, iconFiles: Record<string, Blob>): string {
        let modifiedKML = kmlContent
        for (const [filename, blob] of Object.entries(iconFiles)) {
            const blobUrl = URL.createObjectURL(blob)
            modifiedKML = modifiedKML.split(filename).join(blobUrl)
        }
        return modifiedKML
    }

    function parseKMLFeatures(kmlContent: string, projection: string): FeatureLike[] {
        const format = new KML({
            extractStyles: true,
        })
        register(proj4)

        return format.readFeatures(kmlContent, {
            featureProjection: projection,
            dataProjection: EPSG_4326_WGS84,
        })
    }

    function processTextFeatures(features: FeatureLike[]): void {
        features.forEach((feature) => {
            const name = feature.get('name')
            const text = feature.get('text')
            const isTextFeature = feature.get('isTextFeature')
            const geometry = feature.getGeometry()

            if (
                isTextFeature ||
                (text && geometry?.getType() === 'Point' && !feature.get('iconId'))
            ) {
                const textContent = text || name
                ;(feature as Feature).set('text', textContent)
                ;(feature as Feature).set('isTextFeature', true)
                ;(feature as Feature).setStyle(createTextFeatureStyle(textContent))
            }
        })
    }

    async function initialize(): Promise<void> {
        log.debug({
            title: 'useOlKMZLayer',
            titleColor: LogPreDefinedColor.Rose,
            messages: [`Initializing KMZ layer ${layerId.value}`],
        })
        const positionStore = usePositionStore()

        try {
            const unzipped = await unzippKMZ()
            const { kmlContent, iconFiles } = extractKMLAndIcons(unzipped)
            const modifiedKML = replaceIconReferences(kmlContent, iconFiles)
            const features = parseKMLFeatures(modifiedKML, positionStore.projection.epsg)

            processTextFeatures(features)

            const source = new VectorSource({ features })
            if (olLayer.value) {
                olLayer.value.setSource(source)
            }

            log.debug({
                title: 'useOlKMZLayer',
                titleColor: LogPreDefinedColor.Rose,
                messages: [
                    `KMZ layer ${layerId.value} initialized with ${features.length} features`,
                ],
            })
        } catch (error) {
            log.error({
                title: 'useOlKMZLayer',
                titleColor: LogPreDefinedColor.Rose,
                messages: [`Failed to initialize KMZ layer ${layerId.value}`, error],
            })
            throw error
        }
    }

    const { addLayerToMap } = useAddLayerToMap(olLayer, zIndex, isVisible, opacity, olMap)

    watch(
        () => olLayer.value,
        () => {
            addLayerToMap()
        },
        { immediate: true }
    )

    return {}
}
