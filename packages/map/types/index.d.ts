/* eslint-disable @typescript-eslint/no-explicit-any */

import type { DefineComponent } from 'vue'

export interface ActionDispatcher {
    name: string
}

export const PROJECTION_EPSG: Record<string, string>
export const MapModule: DefineComponent<any, any, any>
export const TimeSlider: DefineComponent<any, any, any>

export function usePositionStore(): any
