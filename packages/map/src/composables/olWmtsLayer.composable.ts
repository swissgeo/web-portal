import type { Map } from "ol";
// import type { ExternalWMTSLayer } from "@swissgeo/layers";
import type { Options as WMTSOptions } from "ol/source/WMTS";

import log from "@swissgeo/log";
import { Tile as TileLayer } from "ol/layer";
import WMTS from "ol/source/WMTS";
import { computed, inject } from "vue";

import useAddLayerToMap from "@/composables/useAddLayerToMap.composable";
// import usePositionStore from "@/stores/position";

// import { timeConfigUtils } from "@swissgeo/layers/utils";

export default function useOlWmtsLayer(
  layerId: string,
  uuid: string,
  options: WMTSOptions,
  opacity: number,
  zIndex: number,
) {
  // const positionStore = usePositionStore();

  const olMap = inject<Map>("olMap");
  if (!olMap) {
    log.error("OpenLayersMap is not available");
    throw new Error("OpenLayersMap is not available");
  }

  const layer = new TileLayer({
    properties: {
      id: layerId,
      uuid,
    },
    opacity
  });

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

  // Use "current" as the default timestamp if not defined in the layer config (or no preview year)
  const timestamp = computed(
    () => "current",
    //   timeConfigUtils.getTimestampFromConfig(externalWmtsLayerConfig),
  );

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

  function setSourceForProjection(): void {
    // if (options && options.tileGrid) {
    log.debug(
      `Set WMTS source for layer ${layerId} with options ${JSON.stringify(
        options,
      )}`,
    );

    layer.setSource(
      new WMTS({ ...options /*, dimensions: dimensions.value*/ }),
    );
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

  useAddLayerToMap(layer, olMap, zIndex);

  // watch(_opacity, (newOpacity) => layer.setOpacity(newOpacity));
  // watch(() => positionStore.projection, setSourceForProjection);

  return { setSourceForProjection, layer };
}
