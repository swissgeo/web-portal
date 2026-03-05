/* eslint-disable @typescript-eslint/no-explicit-any */

import type { DefineComponent } from 'vue'

export interface ActionDispatcher {
    name: string
}

export type PROJECTION_EPSG = Record<string, string>
export type MapModule = DefineComponent<any, any, any>
export type TimeSlider = DefineComponent<any, any, any>

export type * from './layers'
