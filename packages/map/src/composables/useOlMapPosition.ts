import type { CoordinateSystem, SingleCoordinate } from "@swissgeo/coordinates";
import type { View } from "ol";
import type { EventsKey } from "ol/events";
import type Map from "ol/Map";
import type { Ref } from "vue";

import { unByKey } from "ol/Observable";
import { shallowRef, watch } from "vue";

import { useMapStore } from "@/stores/map";

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

  // Following code is needed to make the zoom/rotation/center of olMap reactively
  // available in the store and outside
  // It's keeping the olMap's value in sync with above refs
  let _viewListenerKeys: EventsKey[] = [];
  let _viewChangeKey: EventsKey;

  const _syncCenter = (view: View): void => {
    center.value = view.getCenter() as SingleCoordinate | undefined;
  };

  const _syncZoom = (view: View): void => {
    zoom.value = view.getZoom();
  };

  const _syncRotation = (view: View): void => {
    rotation.value = view.getRotation() ?? 0;
  };

  function _unsubscribeFromView(): void {
    _viewListenerKeys.forEach(unByKey);
    unByKey(_viewChangeKey);
    _viewListenerKeys = [];
  }

  function subscribeToMap(map: Map): void {
    _subscribeToView(map.getView());
    _viewChangeKey = map.on("change:view", () => {
      _subscribeToView(map.getView());
    });
  }

  function _subscribeToView(view: View): void {
    _unsubscribeFromView();
    _syncCenter(view);
    _syncRotation(view);
    _syncZoom(view);

    _viewListenerKeys = [
      view.on("change:center", () => {
        _syncCenter(view);
      }),

      view.on("change:resolution", () => {
        _syncZoom(view);
      }),

      view.on("change:rotation", () => {
        if (!autoRotation.value) {
          _syncRotation(view);
        }
      }),
    ];
  }

  watch(
    () => mapStore.olMap,
    (map) => {
      if (map) {
        subscribeToMap(map);
      } else {
        _unsubscribeFromView();
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
