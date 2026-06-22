import type { Layer as BaseLayer } from "@swissgeo/layers";
import type { MapLayerRenderer } from "@swissgeo/map";

import { OpenLayersDrawingLayer, isDrawingLayer } from "@swissgeo/drawing";
import { useLayerStore } from "@swissgeo/layers";

export function useMapViewerSetup() {
  const geolocationStore = useGeolocationStore();
  const layerStore = useLayerStore();
  const mapViewStore = useMapViewStore();

  const { sources: attributionSources } = useAttributionSources(
    computed(() => layerStore.layers),
    computed(() => layerStore.backgroundLayer),
  );

  const sourceLayers = computed(() => layerStore.layers);
  const backgroundLayer = computed(() => layerStore.backgroundLayer);
  const layersForMap = computed(() => mapViewStore.getMapLayers().value);

  const customLayerRenderers: MapLayerRenderer[] = [
    {
      matches: isDrawingLayer,
      component: OpenLayersDrawingLayer,
    },
  ];

  const displayMode = inject<"web" | "print" | "embed">("displayMode", "web");

  function changeBackground(layer: BaseLayer | null) {
    layerStore.setBackground(layer);
  }

  return {
    geolocationStore,
    layerStore,
    mapViewStore,
    attributionSources,
    sourceLayers,
    backgroundLayer,
    layersForMap,
    customLayerRenderers,
    displayMode,
    changeBackground,
  };
}
