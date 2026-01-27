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
    const styleFunction = (feature: any) => {
        // Check if this is a text feature
        const textContent = feature.get('text') || feature.get('name')
        const geometry = feature.getGeometry()

        if (textContent && geometry?.getType() === 'Point') {
            // Text feature styling
            return new Style({
                image: new CircleStyle({
                    radius: 0, // Invisible point
                    fill: new Fill({
                        color: 'rgba(0, 0, 0, 0)',
                    }),
                }),
                text: new TextStyle({
                    text: textContent,
                    font: '16px sans-serif',
                    fill: new Fill({
                        color: '#000',
                    }),
                    stroke: new Stroke({
                        color: '#fff',
                        width: 3,
                    }),
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
        style: (feature, resolution) => {
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
            extractStyles: true, // Extract styles from KML
        })
        register(proj4)
        const features = format.readFeatures(kmlData, {
            featureProjection: positionStore.projection.epsg, // CH1903+ / LV95 / EPSG:2056
            dataProjection: EPSG_4326_WGS84, // WGS84
        })

        // Restore text property from name for text features (Point geometry with name)
        features.forEach(feature => {
            const name = feature.get('name')
            const text = feature.get('text')
            const geometry = feature.getGeometry()
            // If we have a name but no text, and it's a Point, treat it as text
            if (name && !text && geometry?.getType() === 'Point') {
                feature.set('text', name)
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
