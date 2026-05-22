import type { ResolutionStep } from "@swissgeo/coordinates";
import type { Map } from "ol";
import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { ALL_YEARS_TIMESTAMP } from "@swissgeo/shared";
import ImageLayer from "ol/layer/Image";
import TileLayer from "ol/layer/Tile";
import { ImageWMS, TileWMS } from "ol/source";
import { TileGrid } from "ol/tilegrid";
import { computed, ref, watch, watchEffect } from "vue";

import type { WMSLayer } from "@/types/layers";

import useAddLayerToMap from "@/composables/useAddLayerToMap.composable";
import usePositionStore from "@/stores/position";

/**
 * Default tile size to use when requesting WMS tiles with our internal WMSs (512px)
 *
 * Comes from
 * {@link https://github.com/geoadmin/mf-geoadmin3/blob/master/src/components/map/TileGrid.js}
 */
// TODO move to better place
export const WMS_TILE_SIZE: number = 512; // px

export default function useOlWmsLayer(
  layer: Ref<WMSLayer>,
  olMap: Ref<Map | undefined> | undefined,
) {
  const olLayer = ref<TileLayer<TileWMS> | ImageLayer<ImageWMS>>();
  const source = ref<TileWMS | ImageWMS>();

  const positionStore = usePositionStore();

  const layerId = computed(() => layer.value.layerId);
  const zIndex = computed(() => layer.value.zIndex);
  const isVisible = computed(() => layer.value.isVisible);
  const opacity = computed(() => layer.value.opacity);
  const dimension = computed(() => layer.value.dimensions);
  const gutter = computed(() => layer.value.gutter);
  const version = computed(() => layer.value.version);
  const url = computed(() => layer.value.url);
  const lang = computed(() => layer.value.lang);

  const initialTimestamp = computed(
    () => dimension.value?.time?.currentValue || "current",
  );

  const format = computed(() => "png"); // format seems hardcoded in mapviewer, even though we
  // parse the capabilities to see if it's supported

  /**
   * Definition of all relevant URL param for our WMS backends. This is because both
   * https://openlayers.org/en/latest/apidoc/module-ol_source_TileWMS-TileWMS.html and
   * https://openlayers.org/en/latest/apidoc/module-ol_source_ImageWMS-ImageWMS.html have this
   * option.
   *
   * If we let the URL have all the param beforehand (sending all URL param through the url
   * option), most of our wanted params will be doubled, resulting in longer and more difficult to
   * read URLs
   */
  const createUrlParams = (timestamp: string | null) => {
    const params: Record<string, string | boolean | number | undefined> = {
      // SERVICE: "WMS",
      // REQUEST: "GetMap",
      TRANSPARENT: format.value === "png",
      LAYERS: layerId.value,
      FORMAT: `image/${format.value}`,
      LANG: lang.value,
      VERSION: version.value,
      CRS: positionStore.projection.epsg,
    };
    if (timestamp === ALL_YEARS_TIMESTAMP) {
      // To request all timestamp we need to set the TIME to undefined which will force openlayer
      // to send a request without TIME param, otherwise openlayer takes the previous TIME param.
      params.TIME = undefined;
    } else if (timestamp !== null) {
      params.TIME = timestamp;
    }
    // if (urlParams.value) {
    //   params = { ...params, ...urlParams.value };
    // }
    return params;
  };

  function createImageWMSSource(): ImageWMS {
    const config = {
      url: url.value,
      projection: positionStore.projection.epsg,
      params: createUrlParams(initialTimestamp.value),
      // Limiting image request to exactly the size of the map viewport.
      // We have a couple layers that state when they have lastly been updated at the bottom
      // of the WMS image, and without this ratio prop this label is out of the map viewport.
      // (e.g. ch.bazl.luftfahrthindernis)
      ratio: 1,
    };

    log.debug({
      title: "useOlWMSLayer",
      titleColor: LogPreDefinedColor.Pink,
      messages: [
        `Set WMS Source "ImageWMS" for layer ${layerId.value} with config`,
        config,
      ],
    });

    return new ImageWMS(config);
  }

  function createTileWMSSource(): TileWMS {
    const config = {
      projection: positionStore.projection.epsg,
      url: url.value,
      gutter: gutter.value,
      params: createUrlParams(initialTimestamp.value),
      tileGrid: !positionStore.projection.usesMercatorPyramid
        ? new TileGrid({
            resolutions: positionStore.projection
              .getResolutionSteps()
              .map((step: ResolutionStep) => step.resolution),
            extent: positionStore.projection.bounds?.flatten,
            origin: positionStore.projection.getTileOrigin(),
            tileSize: WMS_TILE_SIZE,
          })
        : undefined,
    };
    log.debug({
      title: "useOlWmsLayer",
      titleColor: LogPreDefinedColor.Pink,
      messages: [
        'Set WMS source "TimeWMS: for layerId with config',
        layerId.value,
        config,
      ],
    });
    log.debug(`Set WMS source "TileWMS" for ${layerId.value} with config`, {
      messages: [config],
    });

    return new TileWMS(config);
  }

  function createLayer() {
    if (gutter.value !== -1) {
      source.value = createTileWMSSource();
      olLayer.value = new TileLayer<TileWMS>({
        properties: {
          id: layerId,
          uuid: layer.value.uuid,
        },
        opacity: opacity.value,
        source: source.value,
      });
    } else {
      source.value = createImageWMSSource();
      olLayer.value = new ImageLayer<ImageWMS>({
        properties: {
          id: layerId,
          uuid: layer.value.uuid,
        },
        opacity: opacity.value,
        source: source.value,
      });
    }
  }
  watch(
    () => layer.value.url,
    () => {
      createLayer();
    },
    { immediate: true },
  );

  const { addLayerToMap } = useAddLayerToMap(
    olLayer,
    zIndex,
    isVisible,
    opacity,
    olMap,
  );

  watch(
    () => olLayer.value,
    () => {
      addLayerToMap();
    },
  );

  watchEffect(() => {
    if (dimension.value?.time?.currentValue) {
      updateTimeDimension(dimension.value?.time?.currentValue);
    }
  });

  watch(
    () => lang.value,
    () => {
      updateSourceParams(dimension.value?.time?.currentValue || "current");
    },
  );

  function updateSourceParams(timestamp: string) {
    if (!source.value) {
      return;
    }
    source.value.updateParams(createUrlParams(timestamp));
  }

  function updateTimeDimension(newTimestamp: string) {
    if (!source.value) {
      log.warn({
        title: "useOlWMSLayer",
        titleColor: LogPreDefinedColor.Pink,
        messages: [
          `Cannot update time dimension for ${layerId.value}: source not initialized yet`,
        ],
      });
      return;
    }

    log.debug({
      title: "useOlWMSLayer",
      titleColor: LogPreDefinedColor.Pink,
      messages: [`Updating the time for ${layerId.value}`, newTimestamp],
    });
    updateSourceParams(newTimestamp);
  }

  return {};
}
