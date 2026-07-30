import type { CoordinateSystem, SingleCoordinate } from "@swissgeo/coordinates";
import type { View } from "ol";
import type { EventsKey } from "ol/events";
import type { default as olMap } from "ol/Map";
import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { unByKey } from "ol/Observable";
import { shallowRef, watch } from "vue";

import { useMapStore } from "@/stores/map";

// Store event listener keys indexed by map's ol_uid
const listenerRegistry = new Map<number, EventsKey[]>();

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

  const _sync = (view: View): void => {
    _syncCenter(view);
    _syncZoom(view);
    _syncRotation(view);
  };

  function subscribeToMap(map: olMap): void {
    // initialize the values
    _sync(map.getView());

    // @ts-expect-error ol_uid is not typed in ol/Map.d.ts
    const mapId = map.ol_uid;
    const listeners: EventsKey[] = [];

    // after moving ended, let's sync the values, which is soon enough
    // for the case we need them. We don't need to track the steps *while* dragging
    // and zooming and rotating
    listeners.push(
      map.on("moveend", () => {
        log.debug({
          title: "useOlMapPosition",
          titleColor: LogPreDefinedColor.Yellow,
          messages: ["Syncing the ol map position to olMapPosition reactivity"],
        });
        _sync(map.getView());
      }),
    );

    listeners.push(
      map.on("change:view", () => {
        _sync(map.getView());
      }),
    );

    // Store listeners in registry
    listenerRegistry.set(mapId, listeners);
  }

  function unsubscribeFromMap(map: olMap): void {
    // @ts-expect-error ol_uid is not typed in ol/Map.d.ts
    const mapId = map.ol_uid;
    const listeners = listenerRegistry.get(mapId);

    if (listeners) {
      // Remove all listeners using unByKey
      unByKey(listeners);
      // Clean up registry
      listenerRegistry.delete(mapId);
    }
  }

  watch(
    () => mapStore.olMap,
    (map, oldMap) => {
      if (map) {
        subscribeToMap(map);
      } else if (oldMap) {
        unsubscribeFromMap(oldMap);
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
