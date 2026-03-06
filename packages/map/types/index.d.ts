/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Layer } from '@swissgeo/layers'
import type { Component, DefineComponent } from 'vue'

export interface ActionDispatcher {
    name: string
}

export interface MapLayerRenderer {
    matches: (layer: Layer) => boolean
    component: Component
}

export const PROJECTION_EPSG: Record<string, string>
export const MapModule: DefineComponent<any, any, any>
export const TimeSlider: DefineComponent<any, any, any>

export function usePositionStore(): any
