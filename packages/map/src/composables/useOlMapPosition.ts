import type { CoordinateSystem, SingleCoordinate } from "@swissgeo/coordinates";
import type { View } from "ol";
import type Map from "ol/Map";
import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { shallowRef, watch } from "vue";

import { useMapStore } from "@/stores/map";

/**
 * Expose the internal OpenLayers position values to the reactive world of vue
 * by listening to a moveend event and setting those values to the reactive
 * state here
 */
export function useOlMapPosition(
  autoRotation: Ref<boolean>,
  projection: Ref<Pick<CoordinateSystem, "bounds" | "getDefaultZoom">>,
) {
  const mapStore = useMapStore();

  const center = shallowRef<SingleCoordinate | undefined>(
    projection.value.bounds.center,
  );
  const zoom = shallowRef<number | undefined>(
    projection.value.getDefaultZoom(),
  );
  const rotation = shallowRef<number>(0);

  const _syncCenter = (view: View): void => {
    center.value = view.getCenter() as SingleCoordinate | undefined;
  };

  const _syncZoom = (view: View): void => {
    zoom.value = view.getZoom();
  };

  const _syncRotation = (view: View): void => {
    rotation.value = view.getRotation() ?? 0;
  };

  function subscribeToMap(map: Map): void {
    // after moving ended, let's sync the values, which is soon enough
    // for the case we need them. We don't need to track the steps *while* dragging
    // and zooming and rotating
    map.on("moveend", () => {
      log.debug({
        title: "useOlMapPosition",
        titleColor: LogPreDefinedColor.Yellow,
        messages: ["Syncing the ol map position to olMapPosition reactivity"],
      });
      _syncCenter(map.getView());
      _syncZoom(map.getView());
      _syncRotation(map.getView());
    });
  }

  watch(
    () => mapStore.olMap,
    (map) => {
      if (map) {
        subscribeToMap(map);
      }
    },
    { immediate: true },
  );

  return {
    zoom,
    rotation,
    center,
  };
}
