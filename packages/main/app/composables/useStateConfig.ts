import type { Layer } from "@swissgeo/layers";
import type { Layer as MapLayer } from "@swissgeo/map";
import type { Dataset } from "@swissgeo/ogc";
import type { LayerState, AppState } from "@swissgeo/statesharing";
import type { Dimension, DimensionId } from "@swissgeo/timeslider";

import { useLayerStore, makeServerLayer } from "@swissgeo/layers";
import log, { LogPreDefinedColor } from "@swissgeo/log";
import { usePositionStore } from "@swissgeo/map";
import { APP_STATE_CONFIG_VERSION } from "@swissgeo/statesharing";
import { useDimensionsStore } from "@swissgeo/timeslider";
import { AVAILABLE_BACKGROUNDS } from "~/components/map/constants";

export type AppStatePayload = {
  version: string;
  state: AppState;
};

const DISPATCHER = { name: "state-config" };

// exported only for testing purpose. Do not use this outside this file
export function isBackgroundLayer(layer: Layer): boolean {
  return AVAILABLE_BACKGROUNDS.includes(layer.humanId);
}
// exported only for testing purpose. Do not use this outside this file
export function layersToStateConfig(layers: MapLayer[]): LayerState[] {
  if (layers.length === 0) {
    return [];
  }

  const startIndex =
    useMapViewStore().mapLayers.length - useLayerStore().layers.length;
  return layers.slice(startIndex).map(layerToStateConfig);
}
// exported only for testing purpose. Do not use this outside this file
export function layerToStateConfig(layer: MapLayer): LayerState {
  const layerStore = useLayerStore();
  const dimensionsStore = useDimensionsStore();
  let sourceData: Layer | undefined | null = layerStore.getLayer(layer.uuid);

  if (!sourceData) {
    sourceData = layerStore.backgroundLayer;
    if (!sourceData || sourceData.uuid !== layer.uuid) {
      log.error(
        `A layer with uuid ${layer?.uuid} couldn't be transformed to a Layer State Config. Most probable reason is a difference between the source Data and the map Layers`,
      );
    }
  }

  if (!sourceData) {
    throw new Error(
      `Cannot serialize layer ${layer.uuid}: no source data found`,
    );
  }
  const config: LayerState = {
    layerUrl: sourceData.layerUrl as string,
    type: sourceData.type as LayerState["type"],
    isVisible: layer.isVisible,
    opacity: layer.opacity,
  };

  const dimensions = dimensionsStore.getDimensions(sourceData.uuid);
  if (dimensions) {
    config.dimensions = {};
    for (const [key, dimension] of Object.entries(dimensions)) {
      if (dimension) {
        config.dimensions[key as DimensionId] = {
          currentValue: dimension.currentValue,
        };
      }
    }
  }

  return config;
}

async function stateConfigToLayer(
  config: LayerState | null,
): Promise<Layer | null> {
  if (!config) {
    return null;
  }

  if (config.layerUrl) {
    const data = await $fetch<Dataset>(config.layerUrl);
    const layer = makeServerLayer(data);

    return layer;
  }
  return null;
}

export function useStateConfig() {
  const positionStore = usePositionStore();
  const layerStore = useLayerStore();
  const dimensionsStore = useDimensionsStore();
  const mapviewStore = useMapViewStore();

  const exportState = computed((): AppStatePayload => {
    return {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        map: {
          center: positionStore.center,
          zoom: positionStore.zoom,
          rotation: positionStore.rotation,
        },
        layers: layersToStateConfig(mapviewStore.mapLayers),
        bg_layer:
          layerStore.backgroundLayer && mapviewStore.mapLayers[0]
            ? layerToStateConfig(mapviewStore.mapLayers[0])
            : null,
      },
    };
  });

  async function importState(payload: AppStatePayload): Promise<void> {
    log.info({
      title: "useStateConfig",
      titleColor: LogPreDefinedColor.Sky,
      messages: ["Importing state config", payload],
    });

    const map = payload.state.map;
    if (map?.center !== null && map?.center !== undefined) {
      positionStore.setCenter(map.center, DISPATCHER);
    }
    if (map?.zoom !== null && map?.zoom !== undefined) {
      positionStore.setZoom(map.zoom, DISPATCHER);
    }
    if (map?.rotation !== null && map?.rotation !== undefined) {
      positionStore.setRotation(map.rotation, DISPATCHER);
    }

    for (const layer of [...layerStore.layers]) {
      dimensionsStore.clearLayerDimensions(layer.uuid);
      layerStore.removeLayer(layer.uuid);
    }
    for (const layer of [...mapviewStore.mapLayers]) {
      mapviewStore.removeLayer(layer.uuid);
    }

    layerStore.setBackground(null);
    const stateLayers = payload.state.layers ?? [];
    const layers = await Promise.all(
      stateLayers.map((lc: LayerState) => stateConfigToLayer(lc)),
    );
    const bgLayer: Layer | null = await stateConfigToLayer(
      payload.state.bg_layer ?? null,
    );

    layerStore.setBackground(bgLayer);

    for (let i = 0; i < layers.length; i++) {
      if (layers[i]) {
        const uuid = layers[i]!.uuid;
        // we're adding some information about visibility and opacity to apply after conversion
        // also setting defaults in case they are not specified
        const mapLayerData: Partial<MapLayer> = {
          opacity: stateLayers[i]?.opacity ?? 1,
          isVisible: stateLayers[i]?.isVisible ?? true,
        };
        layerStore.addImportOption(uuid, mapLayerData);

        if (stateLayers[i]?.dimensions?.time) {
          const dimensions: Partial<Record<DimensionId, Dimension>> = {};
          dimensions.time = {
            currentValue:
              stateLayers[i]!.dimensions!.time!.currentValue ?? null,
            availableValues: [],
          };
          useDimensionsStore().setLayerDimensions(uuid, dimensions);
        }
      }
    }
    // here we add the background layer back
    for (let i = 0; i < layers.length; i++) {
      if (layers[i]) {
        if (isBackgroundLayer(layers[i]!)) {
          layerStore.setBackground(layers[i]!);
        } else {
          layerStore.addLayer(layers[i]!);
        }
      }
    }
  }

  return {
    exportState,
    importState,
  };
}

/**
 * Create a custom state config object not tied to the current app state.
 * Used for print export, where map position and layers differ from the live view.
 */
export function useCustomStateConfig() {
  const mapviewStore = useMapViewStore();
  const layerStore = useLayerStore();
  const customStateMapCenter = ref<[number, number]>([0, 0]);
  const customStateMapZoom = ref(0);
  const customStateMapRotation = ref(0);
  const layerStateConfig = ref<LayerState[]>([]);
  const backgroundLayerStateConfig = ref<LayerState | null>(null);
  const backgroundLayerState = () => {
    if (layerStore.backgroundLayer && mapviewStore.mapLayers[0]) {
      return layerToStateConfig(mapviewStore.mapLayers[0]);
    } else {
      return null;
    }
  };
  const makeUseOfCurrentLayers = () => {
    layerStateConfig.value = layersToStateConfig(mapviewStore.mapLayers);
    backgroundLayerStateConfig.value = backgroundLayerState();
  };

  const customStateConfig = computed((): AppStatePayload => {
    return {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        map: {
          center: customStateMapCenter.value,
          zoom: customStateMapZoom.value,
          rotation: customStateMapRotation.value,
        },
        layers: layerStateConfig.value,
        bg_layer: backgroundLayerStateConfig.value,
      },
    };
  });

  onMounted(makeUseOfCurrentLayers);
  return {
    customStateConfig,
    customStateMapCenter,
    customStateMapZoom,
    customStateMapRotation,
    layerStateConfig,
    makeUseOfCurrentLayers,
  };
}
