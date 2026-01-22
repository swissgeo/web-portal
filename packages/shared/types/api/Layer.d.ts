import type { Style } from '@types/mapbox-gl'

import type { Link, TemplateLink } from '../ogc/Catalog'

export interface LayerData {
    capabilityLink?: Link | TemplateLink
    styleData?: Style
    geoJsonDataLink?: Link | TemplateLink
}
