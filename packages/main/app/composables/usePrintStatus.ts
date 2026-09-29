import { constants } from "@swissgeo/coordinates";
import { useMapStore } from "@swissgeo/map";

import { printFixedScales } from "../types/print";

/**
 * Composable that triggers event sending to the print service when the map is fully loaded
 * and the UI elements are ready.
 *
 * With a `print_scale` in the URL, the page is only ready once the map is drawn at the exact
 * resolution of that scale, and tiled layers show the tile level of that scale.
 */
export function usePrintStatus() {
  const mapStore = useMapStore();
  const { getPrintConfigFromUrl } = useUrlParams();
  const { scale, resolution: dpi } = getPrintConfigFromUrl();

  // Has to be set before the layers are created, which happens when the state is imported.
  // A scale that is not offered in fixed-scale mode has no tile level to pin.
  const fixedScale = printFixedScales.find((fixed) => fixed.scale === scale);
  if (fixedScale) {
    mapStore.setPinnedTileResolution(
      constants.SWISSTOPO_TILEGRID_RESOLUTIONS[fixedScale.level] ?? null,
    );
    onBeforeUnmount(() => mapStore.setPinnedTileResolution(null));
  }

  const pageReady = ref(false);
  const exactResolutionApplied = ref(scale === undefined);
  const printReady = computed(
    () =>
      mapStore.isMapLoaded && pageReady.value && exactResolutionApplied.value,
  );

  /**
   * Tells the UI elements of the page are ready
   */
  function setPageReady() {
    pageReady.value = true;
  }

  /**
   * The state only sets discrete zoom levels, which cannot give a round scale. Once it is applied,
   * the view is therefore set to the exact resolution. The state animates the view, so this is
   * repeated after each animation, and the page is ready once the map is drawn at that resolution.
   * The resolution has to be reached exactly, so the view must not snap to resolutions
   * (`constrainResolution`), or the page would never be ready.
   */
  watch(
    () => mapStore.isMapLoaded && pageReady.value,
    (readyToApply) => {
      const map = mapStore.olMap;
      if (!readyToApply || scale === undefined || !map) {
        return;
      }
      const view = map.getView();
      const targetResolution = getResolutionForScale(scale, dpi);

      const ensureResolution = () => {
        if (!view.getAnimating() && view.getResolution() !== targetResolution) {
          view.setResolution(targetResolution);
        }
      };
      const onRenderComplete = () => {
        if (view.getAnimating() || view.getResolution() !== targetResolution) {
          return;
        }
        map.un("moveend", ensureResolution);
        map.un("rendercomplete", onRenderComplete);
        exactResolutionApplied.value = true;
      };

      map.on("moveend", ensureResolution);
      map.on("rendercomplete", onRenderComplete);
      ensureResolution();
      // Nothing is drawn again when the state already put the view at this resolution
      map.render();
    },
    { immediate: true },
  );

  watch(printReady, () => {
    // Send the readiness signal
    globalThis.postMessage({ type: "gaMapReady" });
  });

  return {
    setPageReady,
  };
}
