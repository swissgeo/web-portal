import type { Map } from "ol";
import type { Extent } from "ol/extent";
import type { Ref, ShallowRef } from "vue";

import { storeToRefs } from "pinia";
import { readonly, ref, watch } from "vue";

import { useMapStore } from "../stores/map";

/**
 * This composable is used to access the OpenLayers map instance and its related properties such as zoom level, center and viewport extent. It also keeps these properties in sync with the map's view.
 */
export function useMap(): {
  olMap: ShallowRef<Map, Map>;
  isMapLoaded: Ref<boolean, boolean>;
  zoomLevel: Readonly<Ref<number, number>>;
  center: Readonly<Ref<readonly [number, number], readonly [number, number]>>;
  viewportExtent: Readonly<Ref<readonly number[], readonly number[]>>;
} {
  // we need to use the store here to get the olMap instance, which is needed to set up the watchers for zoom level, center and viewport extent
  const mapStore = useMapStore();
  const { olMap, isMapLoaded } = storeToRefs(mapStore);
  // Readonly access to the map's zoom level
  const zoomLevel = ref<number>(0);
  // Readonly access to the map's center
  const center = ref<[number, number]>([0, 0]);
  // Readonly access to the map's viewport extent
  const viewportExtent = ref<Extent>([0, 0, 0, 0]);

  watch(
    () => olMap.value,
    (mapInstance) => {
      if (!mapInstance) {
        return;
      }

      const view = mapInstance.getView();

      const updateCenter = () => {
        const newCenter = view.getCenter();
        if (
          newCenter &&
          newCenter[0] !== undefined &&
          newCenter[1] !== undefined
        ) {
          center.value = newCenter.slice(0, 2) as [number, number];
        }

        viewportExtent.value = view.calculateExtent(mapInstance.getSize());
      };

      // initial value
      zoomLevel.value = view.getZoom();
      updateCenter();

      // sync on change
      view.on("change:resolution", () => {
        zoomLevel.value = view.getZoom();
      });

      view.on("change:center", updateCenter);
      // During pan interactions this fires continuously while the pointer is moving.
      mapInstance.on("pointerdrag", updateCenter);
    },
    { immediate: true },
  );

  return {
    olMap,
    isMapLoaded,
    zoomLevel: readonly(zoomLevel),
    center: readonly(center),
    viewportExtent: readonly(viewportExtent),
  };
}
