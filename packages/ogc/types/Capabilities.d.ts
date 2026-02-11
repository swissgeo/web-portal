/**
 * Expose some common types so that not all the packages need to install the openlayers package as
 * dependency
 */

export type WMTSCapabilities = ReturnType<
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    InstanceType<typeof import('ol/format/WMTSCapabilities').default>['read']
>

export type WMSCapabilities = ReturnType<
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    InstanceType<typeof import('ol/format/WMSCapabilities').default>['read']
>

export type GeoJSON = ReturnType<
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    InstanceType<typeof import('ol/format/GeoJSON').default>['read']
>
