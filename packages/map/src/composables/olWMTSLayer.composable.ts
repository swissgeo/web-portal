import type { Options as WMTSOptions } from 'ol/source/WMTS'

import log from '@swissgeo/log'
import { Tile as TileLayer } from 'ol/layer'
import WMTS from 'ol/source/WMTS'

import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'
// import usePositionStore from "@/stores/position";

// import { timeConfigUtils } from "@swissgeo/layers/utils";

export default function useOlWmtsLayer(
    layerId: string,
    uuid: string,
    options: WMTSOptions,
    opacity: number,
    zIndex: number
) {
    // const positionStore = usePositionStore();

    const layer = new TileLayer({
        properties: {
            id: layerId,
            uuid,
        },
        opacity,
    })

    // const dimensions = computed(() => {
    //   if (!options.dimensions) {
    //     return undefined;
    //   }
    //   if (timestamp.value) {
    //     const timeDimension = Object.entries(dimensions).find(
    //       (e) => e[0].toLowerCase() === "time"
    //     );
    //     if (timeDimension) {
    //       dimensions[timeDimension[0]] = timestamp.value;
    //     } else if ("Time" in dimensions) {
    //       dimensions.Time = timestamp.value;
    //     }
    //   }
    //   return dimensions;
    // });

    // const options = computed<WMTSOptions | undefined>(() => {
    //   if (!_layerConfig.options) {
    //     return undefined;
    //   }
    //   const clonedOptions = cloneDeep(_layerConfig.options) as WMTSOptions;
    //   if ("dimension" in clonedOptions) {
    //     delete clonedOptions.dimensions;
    //   }
    //   return clonedOptions;
    // });

    function initialize(): void {
        // if (options && options.tileGrid) {
        log.debug(`Set WMTS source for layer ${layerId} with options`, { messages: [options] })

        layer.setSource(new WMTS({ ...options /*, dimensions: dimensions.value*/ }))
        // } else {
        //   log.debug(`No WMTS options for layer ${layerId} available yet`);
        // }
    }

    // watch(dimensions, () => {
    //   if (dimensions.value !== undefined) {
    //     log.debug("Update wmts dimension", dimensions.value);
    //     const source = layer.getSource();

    //     if (source && source instanceof WMTS) {
    //       source.updateDimensions(dimensions.value);
    //     }
    //   }
    // });

    // watch(options, setSourceForProjection);

    const { setVisibility, setZIndex } = useAddLayerToMap(layer, zIndex)

    // watch(_opacity, (newOpacity) => layer.setOpacity(newOpacity));
    // watch(() => positionStore.projection, setSourceForProjection);

    return { initialize, setVisibility, setZIndex }
}
