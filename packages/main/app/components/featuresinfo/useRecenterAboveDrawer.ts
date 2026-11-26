import type { MapClickEvent } from "@swissgeo/map";

import { usePositionStore } from "@swissgeo/map";
import { clamp } from "es-toolkit";

// A partly open drawer has its top at about half the screen height
const DRAWER_TOP_SHARE = 0.5;
// Smallest distance in px between a tapped point and the top of the drawer
const DRAWER_MARGIN = 48;

/**
 * Moves the map so that a tapped point below the top of the feature info
 * drawer goes to the middle of the map part above the drawer. Near the border
 * of the projection, the map moves only as far as its bounds let it.
 */
export function useRecenterAboveDrawer() {
  const positionStore = usePositionStore();

  function recenterAboveDrawer(mapClickEvent: MapClickEvent, mapTop: number) {
    const drawerTop = window.innerHeight * DRAWER_TOP_SHARE;
    const pointTop = mapTop + mapClickEvent.pixel[1];
    const { center, resolution, rotation } = positionStore;
    const { bounds } = positionStore.projection;
    if (
      pointTop < drawerTop - DRAWER_MARGIN ||
      !center ||
      !resolution ||
      !bounds
    ) {
      return;
    }
    // The point moves up on the screen, so the center moves down. A rotated
    // view turns that screen direction on the map (clockwise in OpenLayers).
    const shift = (pointTop - (mapTop + drawerTop) / 2) * resolution;
    positionStore.setCenter(
      [
        clamp(
          center[0] + shift * Math.sin(rotation),
          bounds.lowerX,
          bounds.upperX,
        ),
        clamp(
          center[1] - shift * Math.cos(rotation),
          bounds.lowerY,
          bounds.upperY,
        ),
      ],
      { name: "feature-info-recenter" },
    );
  }

  return { recenterAboveDrawer };
}
