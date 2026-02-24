import type { Layer } from '@swissgeo/layers'
import type { Component } from 'vue'

export interface MapLayerRenderer {
    matches: (layer: Layer) => boolean
    component: Component
}
