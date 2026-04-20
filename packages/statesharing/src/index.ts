export { APP_STATE_CONFIG_VERSION } from './constants'
export * from './api/serviceStatePortal'
// export * from './model'

export { GetAppStateResponse as ReadAppStateValidator } from './model'
export { SaveAppStateRequest as SaveAppStateValidator } from './model'
export { StateV1 as StatePayloadValidator } from './model'
export type {
    SaveAppStateRequest as SaveAppState,
    GetAppStateResponse as GetAppState,
    LayerState,
    MapState,
} from './api/serviceStatePortal.schemas'
export type { StateV1 as AppState } from './api/serviceStatePortal.schemas'

export * from './api/serviceStatePortal.msw'
