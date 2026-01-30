import type { FeatureLike } from 'ol/Feature'

import log from '@swissgeo/log'
import KML from 'ol/format/KML'
import VectorLayer from 'ol/layer/Vector'
import { register } from 'ol/proj/proj4'
import VectorSource from 'ol/source/Vector'
import { Circle as CircleStyle, Fill, Stroke, Style, Text as TextStyle } from 'ol/style'
import proj4 from 'proj4'

import { EPSG_4326_WGS84 } from '@/composables/types.d'
import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'
import usePositionStore from '@/stores/position'

export default function useOlKMLLayer(
    layerId: string,
    uuid: string,
    kmlData: string,
    opacity: number,
    zIndex: number
) {
    const positionStore = usePositionStore()

    // Style function that handles text features
    const styleFunction = (feature: FeatureLike) => {
        const geometry = feature.getGeometry()

        // Check if this is explicitly marked as a text feature
        const isTextFeature = feature.get('isTextFeature') === true
        const textContent = feature.get('text') || (isTextFeature ? feature.get('name') : null)

        if (isTextFeature || (textContent && geometry?.getType() === DrawingMode.Point && !feature.get('iconId'))) {
            // Text feature styling - invisible point with text label
            return new Style({
                image: new CircleStyle({
                    radius: 0, // Invisible point
                    fill: new Fill({
                        color: 'rgba(0, 0, 0, 0)',
                    }),
                }),
                text: new TextStyle({
                    text: textContent || '',
                    font: '16px sans-serif',
                    fill: new Fill({
                        color: '#000',
                    }),
                    stroke: new Stroke({
                        color: '#fff',
                        width: 3,
                    }),
                    textAlign: 'center',
                    textBaseline: 'middle',
                    offsetY: 0,
                }),
            })
        }

        // Use default KML style for other features
        return null
    }
    const layer = new VectorLayer({
        properties: {
            id: layerId,
            uuid,
        },
        opacity,
        style: (feature) => {
            const customStyle = styleFunction(feature)
            if (customStyle) {
                return customStyle
            }
            // Fall back to feature's own style (from KML)
            return feature.getStyle() || undefined
        },
    })

    function initialize(): void {
        log.debug(`Initializing KML layer ${layerId}`)

        const format = new KML({
            extractStyles: true, // Extract styles from KML for non-text features
        })
        register(proj4)
        const features = format.readFeatures(kmlData, {
            featureProjection: positionStore.projection.epsg, // CH1903+ / LV95 / EPSG:2056
            dataProjection: EPSG_4326_WGS84, // WGS84
        })

        // Restore text properties for text features
        features.forEach(feature => {
            const name = feature.get('name')
            const text = feature.get('text')
            const isTextFeature = feature.get('isTextFeature')
            const geometry = feature.getGeometry()

            // If marked as text feature or has text without iconId, treat as text
            if (isTextFeature || (text && geometry?.getType() === DrawingMode.Point && !feature.get('iconId'))) {
                feature.set('text', text || name)
                feature.set('isTextFeature', true)
                // Clear any style that might have been parsed from KML
                feature.setStyle(undefined)
            }
        })

        const source = new VectorSource({
            features,
        })

        layer.setSource(source)
        log.debug(`KML layer ${layerId} initialized with ${features.length} features`)
    }

    const { setVisibility, setZIndex } = useAddLayerToMap(layer, zIndex)

    return { initialize, setVisibility, setZIndex }
}
