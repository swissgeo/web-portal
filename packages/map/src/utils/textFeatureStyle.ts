import { Circle as CircleStyle, Fill, Stroke, Style, Text as TextStyle } from 'ol/style'

/**
 * Creates an OpenLayers Style for a text feature.
 * Uses an invisible point marker with a visible text label.
 */
export function createTextFeatureStyle(text: string): Style {
    return new Style({
        image: new CircleStyle({
            radius: 0,
            fill: new Fill({
                color: 'rgba(0, 0, 0, 0)',
            }),
        }),
        text: new TextStyle({
            text,
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
