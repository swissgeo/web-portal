import type { Dimension, DimensionId } from "@swissgeo/dimension";
import type { Layer } from "@swissgeo/layers";
import type { Layer as MapLayer } from "@swissgeo/map";
import type { Dataset } from "@swissgeo/ogc";
import type {
  DrawingLayerState,
  LayerState,
  AppState,
} from "@swissgeo/statesharing";
import type { Map as OlMap } from "ol";

import { useDimensionsStore } from "@swissgeo/dimension";
import { useDrawing } from "@swissgeo/drawing";
import { createIdentifyResponse, useFeaturesStore } from "@swissgeo/feature";
import {
  isDatasetLayer,
  makeServerLayer,
  useLayerStore,
} from "@swissgeo/layers";
import log, { LogPreDefinedColor } from "@swissgeo/log";
import { useMap, usePositionStore } from "@swissgeo/map";
import { DRAWING_LAYER_ID } from "@swissgeo/shared";
import { APP_STATE_CONFIG_VERSION } from "@swissgeo/statesharing";

import { AVAILABLE_BACKGROUNDS } from "@/components/sidebar/backgroundSelector/constants";
import { useDrawingImportStore } from "@/stores/drawingImport";

import {
  assertAllowedDrawingDomain,
  checkDrawingAuth,
  DrawingFetchError,
  extractDrawingId,
  fetchDrawingKmz,
  importDrawingKmz,
} from "./useImportDrawing";

export type AppStatePayload = {
  version: string;
  state: AppState;
};

const DISPATCHER = { name: "state-config" };

// exported only for testing purpose. Do not use this outside this file
export function isBackgroundLayer(layer: Layer): boolean {
  return Object.values(AVAILABLE_BACKGROUNDS).includes(layer.humanId);
}

export function isDrawingLayerState(
  state: LayerState | DrawingLayerState,
): state is DrawingLayerState {
  return state.type === "drawing" || "drawingUrl" in state;
}

// exported only for testing purpose. Do not use this outside this file
export function layersToStateConfig(
  layers: MapLayer[],
): Array<LayerState | DrawingLayerState> {
  if (layers.length === 0) {
    return [];
  }

  const startIndex =
    useMapViewStore().mapLayers.length - useLayerStore().layers.length;
  return layers
    .slice(startIndex)
    .map(layerToStateConfig)
    .filter((state) => state !== null);
}

function drawingLayerToStateConfig(layer: MapLayer): DrawingLayerState | null {
  const { drawingId, drawingAdminId } = storeToRefs(useDrawingImportStore());
  if (!drawingId.value) {
    return null;
  }

  const runtimeConfig = useRuntimeConfig();
  return {
    drawingUrl: `${runtimeConfig.public.drawingServiceEndpoint}/${drawingId.value}`,
    type: "drawing",
    adminId: drawingAdminId.value || "",
    isVisible: layer.isVisible,
    opacity: layer.opacity,
  };
}

// exported only for testing purpose. Do not use this outside this file
export function layerToStateConfig(
  layer: MapLayer,
): LayerState | DrawingLayerState | null {
  const layerStore = useLayerStore();
  const dimensionsStore = useDimensionsStore();
  let sourceData: Layer | undefined | null = layerStore.getLayer(layer.uuid);

  if (!sourceData) {
    sourceData = layerStore.backgroundLayer;
    if (!sourceData || sourceData.uuid !== layer.uuid) {
      return null;
    }
  }

  if (sourceData.humanId === DRAWING_LAYER_ID) {
    return drawingLayerToStateConfig(layer);
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

  const features = useFeaturesStore().getShareableFeaturesIdsByUuid[layer.uuid];
  if (features) {
    config.features = features;
  }

  if (isDatasetLayer(sourceData) && sourceData.selectedDistributionId) {
    config.selectedDistributionId = sourceData.selectedDistributionId;
  }

  return config;
}

async function stateConfigToLayer(
  config: LayerState | DrawingLayerState | null,
): Promise<Layer | null> {
  if (!config || isDrawingLayerState(config)) {
    return null;
  }

  if (config.layerUrl) {
    const data = await $fetch<Dataset>(config.layerUrl);
    const layer = await makeServerLayer(data);
    if (isDatasetLayer(layer) && config.selectedDistributionId) {
      layer.selectedDistributionId = config.selectedDistributionId;
    }

    return layer;
  }
  return null;
}

function logDrawingRestoreError(error: unknown): void {
  log.warn({
    title: "useStateConfig",
    titleColor: LogPreDefinedColor.Sky,
    messages: ["Failed to restore drawing layer", String(error)],
  });
}

async function resolveDrawingAdminId(
  drawingId: string,
  adminId: string,
): Promise<string> {
  if (!adminId) {
    return "";
  }

  const status = await checkDrawingAuth(drawingId, adminId);
  return status === 204 ? adminId : "";
}

async function importDrawingState(
  map: OlMap,
  drawingState: DrawingLayerState,
  clearExisting: boolean,
): Promise<void> {
  const { DRAWING_LAYER_UUID } = useDrawing();

  assertAllowedDrawingDomain(drawingState.drawingUrl);
  const drawingId = extractDrawingId(drawingState.drawingUrl);
  const adminId = await resolveDrawingAdminId(
    drawingId,
    drawingState.adminId ?? "",
  );
  const kmzBuffer = await fetchDrawingKmz(drawingState.drawingUrl);

  useLayerStore().addImportOption(DRAWING_LAYER_UUID, {
    opacity: drawingState.opacity ?? 1,
    isVisible: drawingState.isVisible ?? true,
  });
  if (!(await importDrawingKmz(map, kmzBuffer, clearExisting))) {
    throw new Error(
      `Drawing state could not be imported: ${drawingState.drawingUrl}`,
    );
  }

  const drawingImportStore = useDrawingImportStore();
  drawingImportStore.drawingId = drawingId;
  drawingImportStore.drawingAdminId = adminId;
}

async function restoreDrawings(
  map: OlMap,
  drawingStates: DrawingLayerState[],
  notifyUser: (drawingId: string) => void,
): Promise<void> {
  let hasImportedDrawing = false;
  for (const drawingState of drawingStates) {
    try {
      await importDrawingState(map, drawingState, !hasImportedDrawing);
      hasImportedDrawing = true;
    } catch (error) {
      if (error instanceof DrawingFetchError && error.status === 404) {
        notifyUser(extractDrawingId(drawingState.drawingUrl));
      } else {
        logDrawingRestoreError(error);
      }
    }
  }
}

export function useStateConfig() {
  const positionStore = usePositionStore();
  const layerStore = useLayerStore();
  const dimensionsStore = useDimensionsStore();
  const mapviewStore = useMapViewStore();
  const featureStore = useFeaturesStore();
  const toaster = useToaster();
  const { $i18n } = useNuxtApp();
  const { olMap } = useMap();

  const exportState = computed((): AppStatePayload => {
    const bgState =
      layerStore.backgroundLayer && mapviewStore.mapLayers[0]
        ? layerToStateConfig(mapviewStore.mapLayers[0])
        : null;
    return {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        map: {
          center: positionStore.center,
          zoom: positionStore.zoom,
          rotation: positionStore.rotation,
        },
        layers: layersToStateConfig(mapviewStore.mapLayers),
        bg_layer: bgState && !isDrawingLayerState(bgState) ? bgState : null,
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
      featureStore.clearWmsCapability(layer.uuid);
      layerStore.removeLayer(layer.uuid);
    }

    for (const layer of [...mapviewStore.mapLayers]) {
      mapviewStore.removeLayer(layer.uuid);
    }

    layerStore.setBackground(null);

    const stateLayers = payload.state.layers ?? [];
    const layers = await Promise.all(
      stateLayers.map((lc) => stateConfigToLayer(lc)),
    );
    const bgLayer: Layer | null = await stateConfigToLayer(
      payload.state.bg_layer ?? null,
    );

    layerStore.setBackground(bgLayer);

    for (let i = 0; i < layers.length; i++) {
      if (layers[i]) {
        const stateLayer = stateLayers[i];
        if (!stateLayer || isDrawingLayerState(stateLayer)) {
          continue;
        }
        const uuid = layers[i]!.uuid;
        // we're adding some information about visibility and opacity to apply after conversion
        // also setting defaults in case they are not specified
        const mapLayerData: Partial<MapLayer> = {
          opacity: stateLayer.opacity ?? 1,
          isVisible: stateLayer.isVisible ?? true,
        };
        const preSelectedFeaturesIds = stateLayer.features;
        if (preSelectedFeaturesIds) {
          const identifyFeatures = await createIdentifyResponse(
            preSelectedFeaturesIds,
            layers[i]!.humanId,
          );
          featureStore.addFeaturePreselection(uuid, identifyFeatures);
        }
        layerStore.addImportOption(uuid, mapLayerData);

        if (stateLayer.dimensions?.time) {
          const dimensions: Partial<Record<DimensionId, Dimension>> = {};
          dimensions.time = {
            currentValue: stateLayer.dimensions.time.currentValue ?? null,
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

    const drawingStates = stateLayers.filter(isDrawingLayerState);
    if (drawingStates.length > 0) {
      const notifyDrawingNotFound = (drawingId: string) => {
        toaster.showWarning(
          $i18n.t("state.drawingNotFound", { id: drawingId }),
        );
      };
      if (olMap.value) {
        await restoreDrawings(
          olMap.value,
          drawingStates,
          notifyDrawingNotFound,
        );
      } else {
        const stop = watch(olMap, (map) => {
          if (map) {
            stop();
            void restoreDrawings(map, drawingStates, notifyDrawingNotFound);
          }
        });
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
  const layerStateConfig = ref<Array<LayerState | DrawingLayerState>>([]);
  const backgroundLayerStateConfig = ref<LayerState | null>(null);
  const backgroundLayerState = () => {
    if (layerStore.backgroundLayer && mapviewStore.mapLayers[0]) {
      const state = layerToStateConfig(mapviewStore.mapLayers[0]);
      return state && !isDrawingLayerState(state) ? state : null;
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
