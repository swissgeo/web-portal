<script lang="ts" setup>
import { ServerLayer } from '@swissgeo/layers'

import useOlGeoJSONLayer from './composables/olGeoJSONLayer.composable'
import { getLinksByProtocol } from './utils/recordUtils'

const { layer } = defineProps<{
    layer: ServerLayer
}>()

const geoJsonUrl = computed(() => {
    const links = layer.record.links

    const link = getLinksByProtocol(links, 'OGC:GEOJSON')[0]
    const href = link.href

    if (!href) {
        throw new Error('Incomplete geojson record')
    }

    return encodeURIComponent(href)
})

const { data } = await useFetch<string>(`/api/v1/layers/geoJson/${geoJsonUrl.value}`)

const { data: style } = await useFetch<string>(
    `https://api3.geo.admin.ch/static/vectorStyles/${layer.record.id}.json`
)

const geoJsonData = computed(() => {
    // return JSON.parse(data.value)
    if (!data.value) {
        throw new Error('Unable to read the geoJSON Data')
    }
    return JSON.parse(data.value)
})

const geoJsonStyle = computed(() => {
    if (!style.value) {
        throw new Error('Unable to read the geoJSON style')
    }
    return JSON.parse(style.value)

    // return {
    //     type: 'unique',
    //     property: 'quant-class',
    //     values: [
    //         {
    //             geomType: 'point',
    //             value: 0,
    //             minResolution: 100,
    //             vectorOptions: {
    //                 type: 'icon',
    //                 src: 'https://data.geo.admin.ch/ch.meteoschweiz/images/nodata14.png',
    //             },
    //         },
    //         {
    //             geomType: 'point',
    //             value: 0,
    //             maxResolution: 100,
    //             vectorOptions: {
    //                 type: 'icon',
    //                 src: 'https://data.geo.admin.ch/ch.meteoschweiz/images/nodata16.png',
    //                 label: {
    //                     template: '${name}',
    //                     text: {
    //                         textAlign: 'center',
    //                         textBaseline: 'middle',
    //                         font: 'bold 12px FrutigerNeueW02-Regular,Frutiger,sans-serif',
    //                         scale: 1,
    //                         offsetY: -28,
    //                         padding: [2, 2, 2, 2],
    //                         stroke: { color: 'rgba(14,80,114,0.9)', width: 3 },
    //                         backgroundFill: { color: 'rgba(14,80,114,0.9)' },
    //                         fill: { color: 'white' },
    //                     },
    //                 },
    //             },
    //         },
    //         {
    //             geomType: 'point',
    //             value: 1,
    //             minResolution: 250,
    //             vectorOptions: {
    //                 type: 'circle',
    //                 radius: 6,
    //                 fill: { color: 'rgba( 52, 132,150, 1)' },
    //                 stroke: { color: 'rgba(14,80,114,0.9)', width: 2 },
    //             },
    //         },
    //         {
    //             geomType: 'point',
    //             value: 1,
    //             minResolution: 100,
    //             maxResolution: 250,
    //             vectorOptions: {
    //                 type: 'circle',
    //                 radius: 7,
    //                 fill: { color: 'rgba( 52, 132,150, 1)' },
    //                 stroke: { color: 'rgba(14,80,114,0.9)', width: 2 },
    //             },
    //         },
    //         {
    //             geomType: 'point',
    //             value: 1,
    //             maxResolution: 100,
    //             vectorOptions: {
    //                 type: 'circle',
    //                 radius: 8,
    //                 fill: { color: 'rgba( 52, 132,150, 1)' },
    //                 stroke: { color: 'rgba(14,80,114,0.9)', width: 2 },
    //                 label: {
    //                     template: '${name}',
    //                     text: {
    //                         textAlign: 'center',
    //                         textBaseline: 'middle',
    //                         font: 'bold 12px FrutigerNeueW02-Regular,Frutiger,sans-serif',
    //                         scale: 1,
    //                         offsetY: -28,
    //                         padding: [2, 2, 2, 2],
    //                         stroke: { color: 'rgba(14,80,114,0.9)', width: 3 },
    //                         backgroundFill: { color: 'rgba(14,80,114,0.9)' },
    //                         fill: { color: 'white' },
    //                     },
    //                 },
    //             },
    //         },
    //         {
    //             geomType: 'point',
    //             value: 2,
    //             minResolution: 250,
    //             vectorOptions: {
    //                 type: 'circle',
    //                 radius: 6,
    //                 fill: { color: 'rgba(196, 236, 239, 1)' },
    //                 stroke: { color: 'rgba(14,80,114,0.9)', width: 2 },
    //             },
    //         },
    //         {
    //             geomType: 'point',
    //             value: 2,
    //             minResolution: 100,
    //             maxResolution: 250,
    //             vectorOptions: {
    //                 type: 'circle',
    //                 radius: 7,
    //                 fill: { color: 'rgba(196, 236, 239, 1)' },
    //                 stroke: { color: 'rgba(14,80,114,0.9)', width: 2 },
    //             },
    //         },
    //         {
    //             geomType: 'point',
    //             value: 2,
    //             maxResolution: 100,
    //             vectorOptions: {
    //                 type: 'circle',
    //                 radius: 8,
    //                 fill: { color: 'rgba(196, 236, 239, 1)' },
    //                 stroke: { color: 'rgba(14,80,114,0.9)', width: 2 },
    //                 label: {
    //                     template: '${name}',
    //                     text: {
    //                         textAlign: 'center',
    //                         textBaseline: 'middle',
    //                         font: 'bold 12px FrutigerNeueW02-Regular,Frutiger,sans-serif',
    //                         scale: 1,
    //                         offsetY: -28,
    //                         padding: [2, 2, 2, 2],
    //                         stroke: { color: 'rgba(14,80,114,0.9)', width: 3 },
    //                         backgroundFill: { color: 'rgba(14,80,114,0.9)' },
    //                         fill: { color: 'white' },
    //                     },
    //                 },
    //             },
    //         },
    //         {
    //             geomType: 'point',
    //             value: 3,
    //             minResolution: 250,
    //             vectorOptions: {
    //                 type: 'circle',
    //                 radius: 6,
    //                 fill: { color: 'rgba(239, 163, 127, 1)' },
    //                 stroke: { color: 'rgba(14,80,114,0.9)', width: 2 },
    //             },
    //         },
    //         {
    //             geomType: 'point',
    //             value: 3,
    //             minResolution: 100,
    //             maxResolution: 250,
    //             vectorOptions: {
    //                 type: 'circle',
    //                 radius: 7,
    //                 fill: { color: 'rgba(239, 163, 127, 1)' },
    //                 stroke: { color: 'rgba(14,80,114,0.9)', width: 2 },
    //             },
    //         },
    //         {
    //             geomType: 'point',
    //             value: 3,
    //             maxResolution: 100,
    //             vectorOptions: {
    //                 type: 'circle',
    //                 radius: 8,
    //                 fill: { color: 'rgba(239, 163, 127, 1)' },
    //                 stroke: { color: 'rgba(14,80,114,0.9)', width: 2 },
    //                 label: {
    //                     template: '${name}',
    //                     text: {
    //                         textAlign: 'center',
    //                         textBaseline: 'middle',
    //                         font: 'bold 12px FrutigerNeueW02-Regular,Frutiger,sans-serif',
    //                         scale: 1,
    //                         offsetY: -28,
    //                         padding: [2, 2, 2, 2],
    //                         stroke: { color: 'rgba(14,80,114,0.9)', width: 3 },
    //                         backgroundFill: { color: 'rgba(14,80,114,0.9)' },
    //                         fill: { color: 'white' },
    //                     },
    //                 },
    //             },
    //         },
    //     ],
    // }
})

const { initialize, setZIndex, setVisibility } = useOlGeoJSONLayer(
    layer.record.id,
    layer.uuid,
    layer.opacity,
    layer.isLoading,
    geoJsonData.value,
    geoJsonStyle.value,
    layer.zIndex
)

watch(
    () => layer.isVisible,
    (newValue: boolean) => {
        setVisibility(newValue)
    }
)

watch(
    () => layer.zIndex,
    (newZIndex: number) => {
        setZIndex(newZIndex)
    }
)

onMounted(() => {
    initialize()
})
</script>

<template>
    <slot></slot>
</template>
