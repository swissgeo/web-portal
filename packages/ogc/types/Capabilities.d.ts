export type WMTSCapabilities = ReturnType<
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    InstanceType<typeof import('ol/format/WMTSCapabilities').default>['read']
>

export type WMSCapabilities = ReturnType<
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    InstanceType<typeof import('ol/format/WMTSCapabilities').default>['read']
>
