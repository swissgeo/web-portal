import type { Map } from "ol";
import type MapBrowserEvent from "ol/MapBrowserEvent";

import { constants, LV95, registerProj4 } from "@swissgeo/coordinates";
import { View } from "ol";
import { DoubleClickZoom } from "ol/interaction";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import { onBeforeUnmount, onMounted } from "vue";

import usePositionStore, { DEFAULT_PROJECTION } from "@/stores/position";

/**
 * Map view's minimal resolution Currently set so that OL scalebar displays 10 meters Scalebar about
 * 1" on screen, hence about 100px. So, 10 meters/100px = 0.1 Caveat: setting resolution (minimum
 * and maximum) has the precedence over zoom (minimum/maximum)
 */
export const VIEW_MIN_RESOLUTION: number = 0.1; // meters/pixel

export default function useViewBasedOnProjection(map: Map): void {
  const positionStore = usePositionStore();

  registerProj4(proj4);
  register(proj4);

  // this is ready for other projection systems
  const viewsForProjection: Record<string, View> = {};
  viewsForProjection[LV95.epsg] = new View({
    zoom: DEFAULT_PROJECTION.getDefaultZoom(),
    minResolution: VIEW_MIN_RESOLUTION,
    rotation: 0,
    resolutions: constants.LV95_RESOLUTIONS,
    projection: LV95.epsg,
    extent: LV95.bounds.flatten,
    constrainOnlyCenter: true,
    center: DEFAULT_PROJECTION.bounds.center,
  });

  const roundedDoubleClickZoom = new DoubleClickZoom();

  roundedDoubleClickZoom.handleEvent = function (
    event: MapBrowserEvent<PointerEvent>,
  ): boolean {
    // if we double click the map, the map is supposed to zoom to a rounded projection
    // based level, e.g. integer values
    // To achieve that, this code first checks if the *current* zoom level is rounded.
    // If that's not the case, the map is set to the rounded value, before the default
    // double click handler kicks in, increasing the zoom by 1
    if (event.type === "dblclick") {
      event.preventDefault();
      event.stopPropagation();

      const view = map.getView();
      const zoom = view.getZoom();

      if (zoom !== undefined) {
        const roundedZoom = positionStore.projection.roundZoomLevel(zoom);

        // Check if the zoom level is already rounded. If it's not the case,
        // set the map to the next rounded level
        if (zoom !== roundedZoom) {
          view.setZoom(roundedZoom);
        }
      }
    }

    // Call the original handleEvent method which will increase the zoom level by 1
    return DoubleClickZoom.prototype.handleEvent.call(this, event);
  };

  onMounted(() => {
    map.addInteraction(roundedDoubleClickZoom);
    const viewForProjection = viewsForProjection[positionStore.projection.epsg];
    map.setView(viewForProjection);
  });

  onBeforeUnmount(() => {
    map.removeInteraction(roundedDoubleClickZoom);
  });
}
