import type { Dimension, DimensionId, Layer } from "@swissgeo/layers";
import type { Layer as MapLayer } from "@swissgeo/map";
import type { Dataset } from "@swissgeo/ogc";
import type { AppState, LayerStateInput } from "@swissgeo/statesharing";

import { useLayerStore, makeServerLayer } from "@swissgeo/layers";
import log, { LogPreDefinedColor } from "@swissgeo/log";
import { usePositionStore } from "@swissgeo/map";
import { APP_STATE_CONFIG_VERSION } from "@swissgeo/statesharing";
import { AVAILABLE_BACKGROUNDS } from "~/components/map/constants";

export type AppStatePayload = {
  version: string;
  state: AppState;
};

const DISPATCHER = { name: "state-config" };

function isBackgroundLayer(layer: Layer): boolean {
  return AVAILABLE_BACKGROUNDS.includes(layer.humanId);
}

function layersToStateConfig(layers: MapLayer[]): LayerStateInput[] {
  if (layers.length === 0) {
    return [];
  }
  return layers.map(layerToStateConfig);
}

function layerToStateConfig(layer: MapLayer): LayerStateInput {
  const layerStore = useLayerStore();
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

  const config: LayerStateInput = {
    layerUrl: sourceData.layerUrl as string,
    type: sourceData.type as LayerStateInput["type"],
    isVisible: layer.isVisible,
    opacity: layer.opacity,
  };

  if (sourceData.dimensions) {
    config.dimensions = {};
    for (const [key, dim] of Object.entries(sourceData.dimensions)) {
      if (dim) {
        config.dimensions[key as DimensionId] = {
          currentValue: dim.currentValue,
        };
      }
    }
  }

  return config;
}

async function stateConfigToLayer(
  config: LayerStateInput,
): Promise<Layer | null> {
  const layerOptions: Partial<Layer> = {};

  if (config.dimensions) {
    const dims: Partial<Record<DimensionId, Dimension>> = {};
    if (config.dimensions.time) {
      dims.time = {
        currentValue: config.dimensions.time.currentValue ?? null,
        availableValues: [],
      };
    }
    layerOptions.dimensions = dims;
  }

  if (config.layerUrl) {
    const data = await $fetch<Dataset>(config.layerUrl);
    return makeServerLayer(data, layerOptions);
  }
  return null;
}

export function useStateConfig() {
  const positionStore = usePositionStore();
  const layerStore = useLayerStore();
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
      layerStore.removeLayer(layer.uuid);
    }
    for (const layer of [...mapviewStore.mapLayers]) {
      mapviewStore.removeLayer(layer.uuid);
    }

    layerStore.setBackground(null);

    const stateLayers = payload.state.layers ?? [];
    const layers = await Promise.all(
      stateLayers.map((lc: LayerStateInput) => stateConfigToLayer(lc)),
    );

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
      }
    }
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
  const customStateMapCenter = ref<[number, number]>([0, 0]);
  const customStateMapZoom = ref(0);
  const customStateMapRotation = ref(0);
  const layerStateConfig = ref<LayerStateInput[]>([]);

  const makeUseOfCurrentLayers = () => {
    layerStateConfig.value = layersToStateConfig(mapviewStore.mapLayers);
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
